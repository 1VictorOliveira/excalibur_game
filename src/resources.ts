// src/resources.ts
// Centraliza todos os recursos do jogo para pré-carregamento
import { FontSource } from "excalibur";

// Fonte arcade retrô
// BASE_URL: "/" no PC e "/excalibur_game/" no GitHub Pages.
// Com "/fonts/..." fixo, a fonte não carregava depois do deploy.
export const FontArcade = new FontSource(
  `${import.meta.env.BASE_URL}fonts/PressStart2P-Regular.ttf`,
  "PressStart2P"
);

// Lista de todos os recursos para o Loader
export const Resources = {
  FontArcade,
};

// Array para passar ao Loader
export const loadables = [Resources.FontArcade];
