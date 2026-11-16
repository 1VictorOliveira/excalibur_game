// src/actors/parede.ts
import { Actor, CollisionType, Graphic, GraphicsGroup, ImageSource, Sprite, Vector, vec } from "excalibur";
import { Grupos } from "../grupos";
import { Resources } from "../resources";

export type TipoBloco = "runa" | "luz" | "demonio";

type VisualBloco = {
  imagem: ImageSource;
  recorte: { x: number; y: number; width: number; height: number }; // parte visível do sprite
  escala: number;
  tamanho: [number, number]; // colisão quando usado como bloco solto
};

const VISUAL: Record<TipoBloco, VisualBloco> = {
  runa: { imagem: Resources.BlocoRuna, recorte: { x: 1, y: 1, width: 14, height: 14 }, escala: 1, tamanho: [14, 14] },
  luz: { imagem: Resources.BlocoLuz, recorte: { x: 2, y: 2, width: 12, height: 12 }, escala: 1, tamanho: [12, 12] },
  demonio: { imagem: Resources.BlocoDemonio, recorte: { x: 0, y: 0, width: 16, height: 9 }, escala: 2, tamanho: [20, 18] },
};

// Espessura das paredes (um bloco de runa)
export const ESPESSURA_PAREDE = 14;

export class Parede extends Actor {
  // (x, y) = canto superior esquerdo
  constructor(x: number, y: number, largura: number, altura: number, bloco: TipoBloco = "runa") {
    super({
      name: "parede",
      pos: vec(x, y),
      anchor: vec(0, 0),
      width: largura,
      height: altura,
      collisionType: CollisionType.Fixed,
      collisionGroup: Grupos.parede,
    });
    const { grafico, deslocamento } = preencher(VISUAL[bloco], largura, altura);
    this.graphics.use(grafico);
    this.graphics.offset = deslocamento;
  }

  // Bloco solto centralizado em um ponto (pilares e coberturas)
  static bloco(centro: Vector, tipo: TipoBloco): Parede {
    const [l, a] = VISUAL[tipo].tamanho;
    return new Parede(centro.x - l / 2, centro.y - a / 2, l, a, tipo);
  }
}

// Posições dos blocos ao longo de um lado. Sobra que não fecha um bloco inteiro vira sobreposição.
function posicoes(tamanho: number, bloco: number): number[] {
  if (tamanho <= bloco) return [Math.round((tamanho - bloco) / 2)];
  const n = Math.ceil(tamanho / bloco);
  const passo = (tamanho - bloco) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(i * passo));
}

function preencher(v: VisualBloco, largura: number, altura: number): { grafico: Graphic; deslocamento: Vector } {
  const lb = v.recorte.width * v.escala;
  const ab = v.recorte.height * v.escala;
  const xs = posicoes(largura, lb);
  const ys = posicoes(altura, ab);
  const minX = Math.min(0, xs[0]);
  const minY = Math.min(0, ys[0]);
  const membros = [];
  for (const y of ys) {
    for (const x of xs) {
      const sprite = new Sprite({ image: v.imagem, sourceView: v.recorte, destSize: { width: lb, height: ab } });
      membros.push({ graphic: sprite, offset: vec(x - minX, y - minY) });
    }
  }
  return { grafico: new GraphicsGroup({ members: membros }), deslocamento: vec(minX, minY) };
}
