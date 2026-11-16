// src/actors/robos.ts
import { Actor, Collider, CollisionType, Color, Engine, Ray, Vector, vec } from "excalibur";
import { Bala } from "./bala";
import { Jogador } from "./jogador";
import { Parede } from "./parede";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { ResultadoLabirinto } from "../salas/labirinto";
import { explosao } from "../efeitos";
import { saidaLivre } from "../colisao";

const COR_ROBO = Color.fromHex("#d84a4a");
const COR_AVISO = Color.fromHex("#ffffff");

/*
  IA do inimigo (versão sem "suicídio"):
  - Ao entrar na sala, o inimigo aparece aos poucos e fica parado por um instante (aquecimento).
  - Se ENXERGA o jogador (nenhuma parede no caminho), vai direto até ele.
  - Se não enxerga, segue o caminho pelo labirinto, célula por célula (busca em largura).
  - Paredes e outros inimigos só bloqueiam: ninguém morre por encostar neles.
  - Antes de atirar, pisca em branco (aviso), e só atira com linha livre até o jogador,
    sem outro inimigo na frente.
*/
export class Robo extends Actor implements Danificavel {
  velocidade = 25; // mais lento que o jogador (90)
  recargaTiro = 1000; // ms entre tiros
  hp = 2; // aguenta 2 tiros antes de morrer

  private tempoRecarga = 900 + Math.random() * 900; // 1º tiro com atraso, cada um num tempo
  private aquecimento = 700; // ms aparecendo, sem agir, ao entrar na sala
  private aviso = 0; // ms restantes do aviso antes do tiro
  private destruido = false;

  // A visão e o caminho são recalculados a cada 120 ms (não precisa ser todo quadro)
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
    if (!jogador) {
      this.suavizarVelocidade(vec(0, 0), elapsed); // jogador morreu: para devagar
      return;
    }

    this.proximaDecisao -= elapsed;
    if (this.proximaDecisao <= 0) {
      this.proximaDecisao = 120;
      this.decidirRumo(jogador);
    }

    // ---------- Movimento ----------
    let desejada = vec(0, 0);
    const distanciaJogador = jogador.pos.distance(this.pos);
    const pertoDemais = this.enxergaJogador && distanciaJogador <= 15;
    if (this.alvo && !pertoDemais && this.aviso <= 0) {
      const rumo = this.alvo.sub(this.pos);
      if (rumo.size > 1) desejada = rumo.normalize().scale(this.velocidade);
    }
    desejada = desejada.add(this.separacao()); // não se amontoa com outros inimigos
    this.suavizarVelocidade(desejada, elapsed);

    // ---------- Tiro, com aviso antes ----------
    if (this.aviso > 0) {
      this.aviso -= elapsed;
      // pisca branco/vermelho enquanto mira
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
      this.aviso = 350; // começa a mirar
    }
  }

  // Escolhe para onde ir: direto ao jogador se enxerga, senão a próxima célula do caminho
  private decidirRumo(jogador: Jogador): void {
    this.enxergaJogador = this.caminhoLivre(this.pos, jogador.pos, 5);
    if (this.enxergaJogador) {
      this.alvo = jogador.pos.clone();
      return;
    }
    const minhaCelula = this.mapa.celulaDe(this.pos);
    const proxima = this.mapa.proximaCelula(minhaCelula, this.mapa.celulaDe(jogador.pos));
    if (!proxima) {
      this.alvo = null; // sem caminho (célula fechada): espera
      return;
    }
    const centroProxima = this.mapa.centroDaCelula(proxima[0], proxima[1]);
    // Se a linha reta até a próxima célula raspa numa quina, primeiro vai ao centro da célula atual
    this.alvo = this.caminhoLivre(this.pos, centroProxima, 6)
      ? centroProxima
      : this.mapa.centroDaCelula(minhaCelula[0], minhaCelula[1]);
  }

  // Lança 3 raios paralelos (centro e laterais) e confere se nenhuma parede corta o caminho
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

  // Só atira se não houver parede nem outro inimigo entre ele e o jogador (evita fogo amigo "burro")
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

  // Empurra para longe de inimigos muito próximos
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

  // Acelera e freia aos poucos (antes a velocidade mudava de uma vez, dando trancos)
  private suavizarVelocidade(desejada: Vector, elapsed: number): void {
    const fator = Math.min(1, elapsed / 100);
    this.vel = this.vel.add(desejada.sub(this.vel).scale(fator));
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Encostar no jogador: o inimigo se sacrifica e tira 1 de vida (mecânica original mantida).
    // Paredes e outros inimigos agora só bloqueiam.
    if (outro.owner instanceof Jogador) {
      outro.owner.levarDano(1);
      this.destruir();
    }
  }

  destruir(): void {
    if (this.destruido) return;
    this.destruido = true;
    if (this.scene) explosao(this.scene, this.pos, "#ffffff", "#d84a4a");
    this.kill();
  }

  atirar(direcao: Vector): void {
    if (direcao.size === 0 || !this.scene) return;
    if (!saidaLivre(this.scene, this.pos, direcao, 10, 2)) return; // nunca nasce do outro lado de uma parede
    // Bala nasce um pouco à frente do robô
    const saida = this.pos.add(direcao.normalize().scale(10));
    this.scene?.add(new Bala(saida, direcao, Grupos.tiroInimigo, Color.Red));
  }

  levarDano(quantidade: number): void {
    if (this.destruido) return;
    this.hp -= quantidade;
    if (this.hp <= 0) {
      this.destruir();
    } else {
      // Pisca quando leva dano mas não morre
      this.actions.blink(80, 80, 3);
    }
  }
}
