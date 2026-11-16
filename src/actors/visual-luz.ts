// src/actors/visual-luz.ts
import { Animation, AnimationStrategy, SpriteSheet, Vector } from "excalibur";
import { Resources } from "../resources";

// Animações da personagem (32x32). Esquerda = direita espelhada.
const Q = 32;

function folha(imagem: typeof Resources.LuzParada, linhas: number, colunas: number): SpriteSheet {
  return SpriteSheet.fromImageSource({
    image: imagem,
    grid: { rows: linhas, columns: colunas, spriteWidth: Q, spriteHeight: Q },
  });
}

export class VisualLuz {
  readonly parada: Animation;
  readonly direita: Animation;
  readonly esquerda: Animation;
  readonly baixo: Animation;
  readonly cima: Animation;
  readonly dano: Animation;
  readonly morte: Animation;

  constructor() {
    this.parada = Animation.fromSpriteSheet(folha(Resources.LuzParada, 1, 4), [0, 1, 2, 3], 160);
    const andar = folha(Resources.LuzAndar, 3, 4);
    this.direita = Animation.fromSpriteSheet(andar, [0, 1, 2, 3], 110);
    this.esquerda = Animation.fromSpriteSheet(andar, [0, 1, 2, 3], 110);
    this.esquerda.flipHorizontal = true;
    this.baixo = Animation.fromSpriteSheet(andar, [4, 5, 6, 7], 110);
    this.cima = Animation.fromSpriteSheet(andar, [8, 9, 10, 11], 110);
    this.dano = Animation.fromSpriteSheet(folha(Resources.LuzDano, 1, 4), [0, 1, 2, 3], 90, AnimationStrategy.Freeze);
    this.morte = Animation.fromSpriteSheet(folha(Resources.LuzMorte, 1, 8), [0, 1, 2, 3, 4, 5, 6, 7], 130, AnimationStrategy.Freeze);
  }

  // Na diagonal vale o eixo mais forte
  andando(mov: Vector): Animation {
    if (Math.abs(mov.x) >= Math.abs(mov.y)) return mov.x < 0 ? this.esquerda : this.direita;
    return mov.y < 0 ? this.cima : this.baixo;
  }
}
