// src/resources.ts
// Centraliza todos os recursos do jogo para pré-carregamento
import { FontSource } from "excalibur";

// Fonte arcade retrô
export const FontArcade = new FontSource(
  "/fonts/PressStart2P-Regular.ttf",
  "PressStart2P"
);

// Lista de todos os recursos para o Loader
export const Resources = {
  FontArcade,
};

// Array para passar ao Loader
export const loadables = [Resources.FontArcade];
