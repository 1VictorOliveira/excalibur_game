// src/recursos.ts
import { ImageSource, Loader } from "excalibur";
import luzUrl from "./assets/luz.png"; // o Vite resolve o caminho certo (inclusive no GitHub Pages)

export const Recursos = {
  Luz: new ImageSource(luzUrl),
};

export const loader = new Loader(Object.values(Recursos));
loader.suppressPlayButton = true; // começa direto, sem botão de "Play"
