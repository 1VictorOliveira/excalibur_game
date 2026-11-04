// src/ui/logo.ts
import { Actor, Color, Engine, vec } from "excalibur";
import { Recursos } from "../recursos";

/*
  Logo REFRACT com efeito de prisma:
  três cópias do logo tingidas de ciano, magenta e amarelo ficam atrás,
  se separando e voltando, como luz se dividindo ao passar pelo prisma.
*/
export class LogoRefratado extends Actor {
  private tempo = 0;
  private copias: { ator: Actor; direcao: ReturnType<typeof vec> }[] = [];

  constructor(
    x: number,
    private yBase: number,
  ) {
    super({ pos: vec(x, yBase), z: 60 });
  }

  override onInitialize(): void {
    const tons: [string, ReturnType<typeof vec>][] = [
      ["#39d5ff", vec(-1, 0)], // ciano vai para a esquerda
      ["#ff4fd8", vec(1, 0)], // magenta para a direita
      ["#ffe629", vec(0, 1)], // amarelo para baixo
    ];
    for (const [cor, direcao] of tons) {
      const sprite = Recursos.Logo.toSprite();
      sprite.tint = Color.fromHex(cor);
      sprite.opacity = 0.6;
      const ator = new Actor({ z: -1 });
      ator.graphics.use(sprite);
      this.addChild(ator);
      this.copias.push({ ator, direcao });
    }
    this.graphics.use(Recursos.Logo.toSprite());
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;
    const d = Math.round(1 + 1.5 + 1.5 * Math.sin(this.tempo * 2)); // 1 a 4 px
    for (const { ator, direcao } of this.copias) ator.pos = direcao.scale(d);
    this.pos.y = this.yBase + Math.round(Math.sin(this.tempo * 1.5) * 1.5); // flutua de leve (as cópias vão junto)
  }
}
