// src/actors/bala.ts
import { Actor, Collider, CollisionType, Color, Vector } from "excalibur";

export class Bala extends Actor {
  constructor(pos: Vector, direcao: Vector) {
    super({
      name: "bala",
      pos,
      radius: 2,
      color: Color.Yellow,
      vel: direcao.normalize().scale(220), // 220 px/s na direção do tiro
      collisionType: CollisionType.Passive, // detecta colisão, mas não empurra ninguém
    });
  }

  override onInitialize(): void {
    // Se não bater em nada, some depois de 1,5 s (evita bala infinita na memória)
    this.actions.delay(1500).die();
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    const alvo = outro.owner;
    // Gambiarra temporária: ignora o jogador e outras balas.
    // Na issue #10 isso vira grupos de colisão.
    if (alvo.name === "jogador" || alvo.name === "bala") return;
    this.kill();
  }
}
