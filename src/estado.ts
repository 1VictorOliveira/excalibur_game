// src/estado.ts
// Estado global do jogo, persistido entre salas

export type Direcao = "norte" | "sul" | "leste" | "oeste";

export const Estado = {
  coordX: 0,
  coordY: 0,
  portaEntrada: null as Direcao | null, // null = sala inicial
  hp: 3,
  hpMax: 3,
};
