// src/estado.ts
// Estado global do jogo, persistido entre salas

export type Direcao = "norte" | "sul" | "leste" | "oeste";

export const Estado = {
  coordX: 0,
  coordY: 0,
  portaEntrada: null as Direcao | null, // null = sala inicial
  hp: 3,
  hpMax: 3,
  pausado: false, // quando true, jogadores e robôs não executam lógica
  habilidade: 0, // habilidade de luz escolhida (issue #19), mantida entre salas
  salasLimpas: new Set<string>(), // salas sem robôs ou com cristal já pego (issue #20), chave "x,y"
};
