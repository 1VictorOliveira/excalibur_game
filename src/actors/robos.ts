// src/actors/robos.ts
import { Actor, Collider, CollisionType, Color, Engine, Ray, Vector, vec } from "excalibur";
import { Bala } from "./bala";
import { Jogador } from "./jogador";
import { Parede } from "./parede";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { ResultadoLabirinto } from "../salas/labirinto";
import { estouro } from "../efeitos";
import { saidaLivre } from "../colisao";

const COR_ROBO = Color.fromHex("#d84a4a");
const COR_AVISO = Color.fromHex("#ffffff");

/*
  IA do robô:
  - aparece aos poucos e espera um instante ao entrar na sala
  - vê o jogador: vai direto; não vê: segue o caminho pelas células (BFS)
  - pisca antes de atirar e só atira com linha livre até o jogador
*/
export class Robo extends Actor implements Danificavel {
  velocidade = 25;
  recargaTiro = 1000; // ms entre tiros
  hp = 2;

  private tempoRecarga = 900 + Math.random() * 900; // atraso do 1º tiro
  private aquecimento = 700; // ms parado ao entrar
  private aviso = 0; // ms de aviso antes do tiro
  private destruido = false;

  // Visão e caminho recalculados a cada 120 ms
  private proximaDecisao = 0;
  private enxergaJogador = false;
  private alvo: Vector | null = null;

  constructor(
    pos: Vector,
    private mapa: ResultadoLabirinto,
  ) {
    super({
      name: "robo",
      pos,
      width: 10,
      height: 14,
      color: COR_ROBO,
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.robo,
    });
  }

  override onInitialize(): void {
    this.graphics.opacity = 0;
    this.actions.fade(1, this.aquecimento);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (Estado.pausado || this.destruido) return;

    if (this.aquecimento > 0) {
      this.aquecimento -= elapsed;
      this.vel = vec(0, 0);
      return;
    }

    const jogador = this.scene?.actors.find((a) => a.name === "jogador") as Jogador | undefined;
    if (!jogador || jogador.estaMorto) {
      this.suavizarVelocidade(vec(0, 0), elapsed);
      return;
    }

    this.proximaDecisao -= elapsed;
    if (this.proximaDecisao <= 0) {
      this.proximaDecisao = 120;
      this.decidirRumo(jogador);
    }

    let desejada = vec(0, 0);
    const distanciaJogador = jogador.pos.distance(this.pos);
    const pertoDemais = this.enxergaJogador && distanciaJogador <= 15;
    if (this.alvo && !pertoDemais && this.aviso <= 0) {
      const rumo = this.alvo.sub(this.pos);
      if (rumo.size > 1) desejada = rumo.normalize().scale(this.velocidade);
    }
    desejada = desejada.add(this.separacao());
    this.suavizarVelocidade(desejada, elapsed);

    // Tiro com aviso
    if (this.aviso > 0) {
      this.aviso -= elapsed;
      this.color = Math.floor(this.aviso / 70) % 2 === 0 ? COR_AVISO : COR_ROBO;
      if (this.aviso <= 0) {
        this.color = COR_ROBO;
        if (this.podeAtirarEm(jogador)) this.atirar(jogador.pos.sub(this.pos));
        this.tempoRecarga = this.recargaTiro;
      }
      return;
    }

    this.tempoRecarga -= elapsed;
    if (this.tempoRecarga <= 0 && this.enxergaJogador && this.podeAtirarEm(jogador)) {
      this.aviso = 350;
    }
  }

  // Destino: o jogador (se visível) ou a próxima célula do caminho
  private decidirRumo(jogador: Jogador): void {
    this.enxergaJogador = this.caminhoLivre(this.pos, jogador.pos, 5);
    if (this.enxergaJogador) {
      this.alvo = jogador.pos.clone();
      return;
    }
    const minhaCelula = this.mapa.celulaDe(this.pos);
    const proxima = this.mapa.proximaCelula(minhaCelula, this.mapa.celulaDe(jogador.pos));
    if (!proxima) {
      this.alvo = null;
      return;
    }
    const centroProxima = this.mapa.centroDaCelula(proxima[0], proxima[1]);
    // Se a reta raspa numa quina, passa antes pelo centro da célula atual
    this.alvo = this.caminhoLivre(this.pos, centroProxima, 6)
      ? centroProxima
      : this.mapa.centroDaCelula(minhaCelula[0], minhaCelula[1]);
  }

  // 3 raios paralelos (centro e laterais) sem parede no caminho
  private caminhoLivre(de: Vector, ate: Vector, meiaLargura: number): boolean {
    const cena = this.scene;
    if (!cena) return false;
    const rumo = ate.sub(de);
    const distancia = rumo.size;
    if (distancia < 1) return true;
    const dir = rumo.normalize();
    const lateral = dir.perpendicular().scale(meiaLargura);
    for (const desvio of [vec(0, 0), lateral, lateral.negate()]) {
      const acertos = cena.physics.rayCast(new Ray(de.add(desvio), dir), {
        maxDistance: distancia,
        searchAllColliders: false,
        filter: (acerto) => acerto.collider.owner instanceof Parede,
      });
      if (acertos.length > 0) return false;
    }
    return true;
  }

  // Linha livre de paredes e de outros robôs
  private podeAtirarEm(jogador: Jogador): boolean {
    const cena = this.scene;
    if (!cena || !this.caminhoLivre(this.pos, jogador.pos, 2)) return false;
    const rumo = jogador.pos.sub(this.pos);
    const acertos = cena.physics.rayCast(new Ray(this.pos, rumo.normalize()), {
      maxDistance: rumo.size,
      searchAllColliders: true,
      filter: (acerto) => acerto.collider.owner instanceof Robo && acerto.collider.owner !== this,
    });
    return acertos.length === 0;
  }

  // Afasta de robôs muito próximos
  private separacao(): Vector {
    let empurrao = vec(0, 0);
    for (const outro of this.scene?.actors ?? []) {
      if (outro === this || !(outro instanceof Robo)) continue;
      const afastamento = this.pos.sub(outro.pos);
      const d = afastamento.size;
      if (d > 0 && d < 18) empurrao = empurrao.add(afastamento.normalize().scale(((18 - d) / 18) * this.velocidade));
    }
    return empurrao;
  }

  // Acelera e freia aos poucos
  private suavizarVelocidade(desejada: Vector, elapsed: number): void {
    const fator = Math.min(1, elapsed / 100);
    this.vel = this.vel.add(desejada.sub(this.vel).scale(fator));
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Encostar no jogador: o robô explode e tira 1 de vida
    if (outro.owner instanceof Jogador) {
      outro.owner.levarDano(1);
      this.destruir();
    }
  }

  destruir(): void {
    if (this.destruido) return;
    this.destruido = true;
    if (this.scene) estouro(this.scene, this.pos, 3, 8);
    this.kill();
  }

  atirar(direcao: Vector): void {
    if (direcao.size === 0 || !this.scene) return;
    if (!saidaLivre(this.scene, this.pos, direcao, 10, 2)) return;
    const saida = this.pos.add(direcao.normalize().scale(10));
    this.scene?.add(new Bala(saida, direcao, Grupos.tiroInimigo, Color.Red));
  }

  levarDano(quantidade: number): void {
    if (this.destruido) return;
    this.hp -= quantidade;
    if (this.hp <= 0) {
      this.destruir();
    } else {
      this.actions.blink(80, 80, 3);
    }
  }
}
