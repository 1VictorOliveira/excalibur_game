// src/luz/projeteis.ts
import { Actor, Collider, Color, CollisionType, Engine, Line, Ray, Vector, vec } from "excalibur";
import { podeLevarDano } from "../dano";
import { paredesDaCena, primeiraBatida, refletir } from "../colisao";
import { faisca } from "../efeitos";
import { Grupos } from "../grupos";
import { Parede } from "../actors/parede";

/*
  FEIXE REFLETIDO (Lei da Reflexão)
  O ângulo de incidência é igual ao ângulo de reflexão: ao bater numa parede,
  só a componente da velocidade perpendicular à parede inverte de sinal.
  Em vetor: v' = v - 2 (v · n) n, onde n é a normal da parede.

  O feixe se move "na mão" e varre o caminho do quadro contra as paredes,
  reagindo só à PRIMEIRA parede. Antes, ao encostar em duas paredes no mesmo
  quadro (onde elas se encontram), refletia duas vezes e atravessava a parede.
*/
const RAIO_FEIXE = 2;

export class FeixeRefletido extends Actor {
  private ricochetesRestantes: number;
  private direcao: Vector;
  private rapidez = 200; // px/s
  private acabou = false;

  constructor(pos: Vector, direcao: Vector, cor: Color, ricochetes = 3) {
    super({
      name: "feixe",
      pos,
      radius: RAIO_FEIXE,
      color: cor,
      collisionType: CollisionType.Passive,
      collisionGroup: Grupos.tiroJogador,
    });
    this.ricochetesRestantes = ricochetes;
    this.direcao = direcao.normalize();
  }

  override onInitialize(): void {
    this.actions.delay(4000).die(); // segurança: não fica quicando para sempre
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.acabou || !this.scene) return;
    let restante = (this.rapidez * elapsed) / 1000;
    if (restante <= 0) return; // pausado
    const paredes = paredesDaCena(this.scene);
    let pos = this.pos.clone();

    // Até 3 batidas no mesmo quadro (ex.: entrando numa quina)
    for (let i = 0; i < 3 && restante > 0; i++) {
      const batida = primeiraBatida(paredes, pos, this.direcao, restante, RAIO_FEIXE);
      if (!batida) {
        pos = pos.add(this.direcao.scale(restante));
        break;
      }
      pos = pos.add(this.direcao.scale(batida.avanco));
      restante -= batida.avanco;
      if (this.ricochetesRestantes <= 0) {
        this.pos = pos;
        this.terminar();
        return;
      }
      this.ricochetesRestantes--;
      this.direcao = refletir(this.direcao, batida.normal);
      faisca(this.scene, pos); // faísca no ricochete
    }
    this.pos = pos;
    this.vel = vec(0, 0);
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Paredes são tratadas na varredura acima
    const alvo = outro.owner;
    if (this.acabou || alvo instanceof Parede) return;
    if (podeLevarDano(alvo)) alvo.levarDano(1);
    this.terminar();
  }

  private terminar(): void {
    this.acabou = true;
    this.kill();
  }
}

/*
  RAIO FOCADO (Lente convergente)
  A luz concentrada vira um laser instantâneo: atravessa todos os inimigos
  em linha reta até encontrar a primeira parede.
*/
export class RaioFocado extends Actor {
  constructor(origem: Vector, fim: Vector, cor: Color, espessura: number) {
    super({ pos: vec(0, 0), anchor: vec(0, 0), z: 10 });
    this.graphics.use(new Line({ start: origem, end: fim, color: cor, thickness: espessura }));
  }

  override onInitialize(): void {
    this.actions.fade(0, 250).die(); // o laser some rapidinho
  }

  // Dispara o raio: calcula até onde vai, aplica dano e desenha
  static disparar(atirador: Actor, direcao: Vector, dano: number, cor: Color): void {
    const cena = atirador.scene;
    if (!cena) return;

    const dir = direcao.normalize();
    const origem = atirador.pos.add(dir.scale(6));
    const alcanceMaximo = 400;

    const acertos = cena.physics.rayCast(new Ray(origem, dir), {
      maxDistance: alcanceMaximo,
      searchAllColliders: true, // queremos TODOS os acertos, não só o primeiro
      // só interessa parede e o que pode levar dano (ignora o próprio jogador e as balas)
      filter: (acerto) => {
        const dono = acerto.collider.owner;
        return dono !== atirador && (dono instanceof Parede || podeLevarDano(dono));
      },
    });

    // A primeira parede no caminho bloqueia o raio
    let distanciaParede = alcanceMaximo;
    for (const acerto of acertos) {
      if (acerto.collider.owner instanceof Parede) {
        distanciaParede = Math.min(distanciaParede, acerto.distance);
      }
    }

    // Todo inimigo antes da parede leva dano (o raio atravessa)
    for (const acerto of acertos) {
      const alvo = acerto.collider.owner;
      if (acerto.distance < distanciaParede && podeLevarDano(alvo)) alvo.levarDano(dano);
    }

    const fim = origem.add(dir.scale(distanciaParede));
    cena.add(new RaioFocado(origem, fim, cor, 1 + dano));
  }
}
