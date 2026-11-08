// src/luz/projeteis.ts
import { Actor, Collider, Color, CollisionType, Line, Ray, Vector, vec } from "excalibur";
import { podeLevarDano } from "../dano";
import { Estado } from "../estado";
import { Grupos } from "../grupos";
import { Parede } from "../actors/parede";

/*
  FEIXE REFLETIDO (Lei da Reflexão)
  O ângulo de incidência é igual ao ângulo de reflexão: ao bater numa parede,
  só a componente da velocidade perpendicular à parede inverte de sinal.
  Em vetor: v' = v - 2 (v · n) n, onde n é a normal da parede.
*/
export class FeixeRefletido extends Actor {
  private ricochetesRestantes: number;
  private velocidadeGuardada: Vector | null = null; // usada durante a pausa

  constructor(pos: Vector, direcao: Vector, cor: Color, ricochetes = 3) {
    super({
      name: "feixe",
      pos,
      radius: 2,
      color: cor,
      vel: direcao.normalize().scale(200),
      collisionType: CollisionType.Passive,
      collisionGroup: Grupos.tiroJogador,
    });
    this.ricochetesRestantes = ricochetes;
  }

  override onInitialize(): void {
    this.actions.delay(4000).die(); // segurança: não fica quicando para sempre
  }

  override onPreUpdate(): void {
    // Congela durante a pausa e volta com a mesma velocidade depois
    if (Estado.pausado && !this.velocidadeGuardada) {
      this.velocidadeGuardada = this.vel.clone();
      this.vel = vec(0, 0);
    } else if (!Estado.pausado && this.velocidadeGuardada) {
      this.vel = this.velocidadeGuardada;
      this.velocidadeGuardada = null;
    }
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    const alvo = outro.owner;

    if (alvo instanceof Parede) {
      if (this.ricochetesRestantes <= 0) {
        this.kill();
        return;
      }
      this.ricochetesRestantes--;

      // Descobre qual face da parede foi atingida olhando de onde o feixe veio:
      // se antes ele estava fora da faixa horizontal da parede, bateu numa face lateral.
      const caixa = outro.bounds;
      const antes = this.oldPos;
      const normal =
        antes.x < caixa.left || antes.x > caixa.right
          ? vec(Math.sign(antes.x - caixa.center.x), 0) // face esquerda/direita
          : vec(0, Math.sign(antes.y - caixa.center.y)); // face de cima/baixo

      // v' = v - 2 (v · n) n
      this.vel = this.vel.sub(normal.scale(2 * this.vel.dot(normal)));
      this.pos = antes.clone(); // volta para fora da parede antes de seguir
      return;
    }

    if (podeLevarDano(alvo)) alvo.levarDano(1);
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
