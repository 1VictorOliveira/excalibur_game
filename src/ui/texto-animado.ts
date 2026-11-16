// src/ui/texto-animado.ts
import { Actor, Animation, AnimationStrategy, CollisionType, ImageSource, SpriteSheet, Vector } from "excalibur";

// Texto animado em folha de 8 quadros: 1-3 entrada, 4-6 loop, 7-8 saída
export type OpcoesTexto = {
  duracao?: number; // ms até sair (sem valor = fica até sair())
  entrada?: number[];
  tempoEntrada?: number;
  tempoBrilho?: number;
  z?: number;
};

export class TextoAnimado extends Actor {
  private entrada: Animation;
  private brilho: Animation;
  private saida: Animation;
  private saindo = false;

  constructor(
    imagem: ImageSource,
    largura: number,
    altura: number,
    pos: Vector,
    private opcoes: OpcoesTexto = {},
  ) {
    super({ pos, z: opcoes.z ?? 100, collisionType: CollisionType.PreventCollision });
    const folha = SpriteSheet.fromImageSource({
      image: imagem,
      grid: { rows: 1, columns: 8, spriteWidth: largura, spriteHeight: altura },
    });
    this.entrada = Animation.fromSpriteSheet(folha, opcoes.entrada ?? [0, 1, 2], opcoes.tempoEntrada ?? 90, AnimationStrategy.End);
    this.brilho = Animation.fromSpriteSheet(folha, [3, 4, 5], opcoes.tempoBrilho ?? 150);
    this.saida = Animation.fromSpriteSheet(folha, [6, 7, 7], 130, AnimationStrategy.End);

    this.entrada.events.on("end", () => {
      if (!this.saindo) this.graphics.use(this.brilho);
    });
    this.saida.events.on("end", () => this.kill());
  }

  override onInitialize(): void {
    this.graphics.use(this.entrada);
    if (this.opcoes.duracao) this.actions.delay(this.opcoes.duracao).callMethod(() => this.sair());
  }

  sair(): void {
    if (this.saindo) return;
    this.saindo = true;
    this.saida.reset();
    this.graphics.use(this.saida);
  }
}
