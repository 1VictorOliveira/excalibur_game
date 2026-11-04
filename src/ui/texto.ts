// src/ui/texto.ts
import { Actor, Color, Engine, Font, Text, vec } from "excalibur";
import { Recursos } from "../recursos";

// A Press Start 2P fica nítida em múltiplos de 8 (8, 16, 24...)
export function fonte(tamanho: number, cor: string): Font {
  return Recursos.Fonte.toFont({
    size: tamanho,
    color: Color.fromHex(cor),
    // Alinhamento padrão (esquerda/topo): quem centraliza é a âncora do Actor (0.5, 0.5).
    // Com TextAlign.Center o texto ficaria deslocado meio texto para a esquerda.
    smoothing: false,
  });
}

// Texto simples centralizado, com opção de piscar
export class Texto extends Actor {
  private tempo = 0;

  constructor(
    texto: string,
    x: number,
    y: number,
    tamanho: number,
    cor: string,
    private piscar = false,
  ) {
    super({ pos: vec(x, y), z: 50 });
    this.graphics.use(new Text({ text: texto, font: fonte(tamanho, cor) }));
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (!this.piscar) return;
    this.tempo += elapsed / 1000;
    this.graphics.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.tempo * 4));
  }
}

/*
  Título "refratado": três cópias do texto em ciano, magenta e amarelo,
  levemente deslocadas e oscilando, como luz passando por um prisma.
  A cópia branca fica por cima.
*/
export class TituloRefratado extends Actor {
  private tempo = 0;
  private ciano: Actor;
  private magenta: Actor;
  private amarelo: Actor;

  constructor(texto: string, x: number, y: number, tamanho: number) {
    super({ pos: vec(x, y), z: 60 });
    const criar = (cor: string, z: number) => {
      const a = new Actor({ z });
      a.graphics.use(new Text({ text: texto, font: fonte(tamanho, cor) }));
      a.graphics.opacity = 0.8;
      return a;
    };
    this.ciano = criar("#39d5ff", 57);
    this.magenta = criar("#ff4fd8", 58);
    this.amarelo = criar("#ffe629", 59);
    this.addChild(this.ciano);
    this.addChild(this.magenta);
    this.addChild(this.amarelo);
    this.graphics.use(new Text({ text: texto, font: fonte(tamanho, "#ffffff") }));
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;
    const d = 1 + Math.round(1.5 + 1.5 * Math.sin(this.tempo * 2)); // 1 a 4 px
    this.ciano.pos = vec(-d, 0);
    this.magenta.pos = vec(d, 0);
    this.amarelo.pos = vec(0, Math.round(d / 2));
    this.pos.y += Math.sin(this.tempo * 1.5) * 0.05; // flutua bem de leve
  }
}
