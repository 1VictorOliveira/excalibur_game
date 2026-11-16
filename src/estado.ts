// src/estado.ts
// Estado global da partida

export type Direcao = "norte" | "sul" | "leste" | "oeste";

export const Estado = {
  coordX: 0,
  coordY: 0,
  portaEntrada: null as Direcao | null, // null = sala inicial
  hp: 3,
  hpMax: 3,
  pausado: false,
  habilidade: 0, // habilidade escolhida
  salasLimpas: new Set<string>(), // chaves "x,y" das salas já limpas
};
