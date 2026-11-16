// src/ui/fonte.ts
import { Color, Font, FontUnit } from "excalibur";
import { Resources } from "../resources";

/*
  Fonte Press Start 2P.
  Tamanhos múltiplos de 8; sem textAlign (a âncora do ator já centraliza).
*/
export function fontePixel(tamanho: number, cor: Color): Font {
  return Resources.FontArcade.toFont({
    size: tamanho,
    unit: FontUnit.Px,
    color: cor,
    smoothing: false,
  });
}
