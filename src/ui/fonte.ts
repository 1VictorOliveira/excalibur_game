// src/ui/fonte.ts
import { Color, Font, FontUnit } from "excalibur";
import { Resources } from "../resources";

/*
  Fonte pixel do jogo (Press Start 2P), já carregada pelo Loader.
  - Use tamanhos múltiplos de 8 (8, 16, 24): em outros tamanhos ela borra.
  - Não use textAlign: o Actor já centraliza o texto pela âncora (0.5, 0.5).
    Com TextAlign.Center o texto ficava deslocado meio texto para a esquerda,
    e por isso havia "gambiarras" como pos: vec(cx + 35, ...) para compensar.
  - Não escreva family: "'Press Start 2P'" na mão: a fonte foi registrada como
    "PressStart2P", então esse nome não existe e o navegador usava monospace.
*/
export function fontePixel(tamanho: number, cor: Color): Font {
  return Resources.FontArcade.toFont({
    size: tamanho,
    unit: FontUnit.Px,
    color: cor,
    smoothing: false,
  });
}
