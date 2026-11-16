// src/actors/bala.ts
import { Actor, Collider, CollisionGroup, CollisionType, Color, Vector } from "excalibur";
import { podeLevarDano } from "../dano";

export class Bala extends Actor {
  dano = 1;

  constructor(
    pos: Vector,
    direcao: Vector,
    grupo: CollisionGroup,
    cor = Color.Yellow,
    velocidade = 220,
    private readonly tempoVida = 1500,
    raio = 2,
  ) {
    super({
      name: "bala",
      pos,
      radius: raio,
      color: cor,
      vel: direcao.normalize().scale(velocidade),
      collisionType: CollisionType.Passive,
      collisionGroup: grupo, // quem ela pode acertar é decidido pelo grupo
    });
  }

  override onInitialize(): void {
    this.actions.delay(this.tempoVida).die();
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // O grupo já filtrou: se chegou aqui, é um alvo válido ou uma parede.
    const alvo = outro.owner;
    if (podeLevarDano(alvo)) alvo.levarDano(this.dano);
    this.kill();
  }
}
