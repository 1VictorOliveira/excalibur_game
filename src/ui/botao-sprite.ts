// src/ui/botao-sprite.ts
import { Actor, Animation, AnimationStrategy, CollisionType, ImageSource, Sprite, SpriteSheet, Vector } from "excalibur";

// Botão por sprite: linhas normal, escolhido (loop) e apertado (uma vez)
export class BotaoSprite extends Actor {
  private normal: Sprite;
  private escolhido: Animation;
  private apertado: Animation;
  private estaEscolhido = false;

  constructor(imagem: ImageSource, pos: Vector, z = 60) {
    super({ pos, z, collisionType: CollisionType.PreventCollision });
    const folha = SpriteSheet.fromImageSource({
      image: imagem,
      grid: { rows: 3, columns: 4, spriteWidth: 96, spriteHeight: 16 },
    });
    this.normal = folha.getSprite(0, 0);
    this.escolhido = Animation.fromSpriteSheet(folha, [4, 5, 6, 7], 140);
    this.apertado = Animation.fromSpriteSheet(folha, [8, 9, 10, 11], 70, AnimationStrategy.Freeze);
    this.graphics.use(this.normal);
  }

  escolher(sim: boolean): void {
    if (sim === this.estaEscolhido) return;
    this.estaEscolhido = sim;
    if (sim) this.escolhido.reset();
    this.graphics.use(sim ? this.escolhido : this.normal);
  }

  apertar(): void {
    this.apertado.reset();
    this.graphics.use(this.apertado);
  }
}
