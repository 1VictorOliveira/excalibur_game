// src/salas/procedural.ts
import { criarAleatorio, EstiloSala } from "./labirinto";
import { sementeDaSala } from "./mapa";

/*
  Salas procedurais (issue #20), no espírito do Enter the Gungeon:
  cada coordenada (x, y) do mapa gera SEMPRE a mesma sala, mas salas diferentes
  têm tipos diferentes, e a dificuldade cresce conforme o jogador se afasta do início.
*/

export type TipoSala = "inicio" | "labirinto" | "pilares" | "arena" | "tesouro";

export type PlanoSala = {
  tipo: TipoSala;
  estilo: EstiloSala;
  semente: number;
  distancia: number; // quantas salas longe do início
  quantidadeRobos: number;
  velocidadeRobo: number;
  recargaRobo: number; // ms entre tiros do robô
  temCristal: boolean;
  nome: string; // aviso que aparece ao entrar ("" = nenhum)
};

export function chaveDaSala(x: number, y: number): string {
  return `${x},${y}`;
}

export function planejarSala(x: number, y: number): PlanoSala {
  const semente = sementeDaSala(x, y);
  const aleatorio = criarAleatorio(semente ^ 0x9e3779b9); // outra sequência, separada da do labirinto
  const distancia = Math.abs(x) + Math.abs(y);

  // Dificuldade: +1 robô e robôs um pouco mais rápidos e agressivos a cada sala de distância
  const dificuldade = {
    quantidadeRobos: Math.min(2 + distancia, 7),
    velocidadeRobo: Math.min(25 + distancia * 3, 50),
    recargaRobo: Math.max(1000 - distancia * 80, 450),
  };

  // Sala inicial: sempre um labirinto calmo
  if (distancia === 0) {
    return { tipo: "inicio", estilo: "paredes", semente, distancia, ...dificuldade, temCristal: false, nome: "" };
  }

  // Sorteio do tipo (com semente: a mesma sala sempre tem o mesmo tipo)
  const r = aleatorio();
  if (r < 0.12) {
    return {
      tipo: "tesouro", estilo: "pilares", semente, distancia, ...dificuldade,
      quantidadeRobos: 0, temCristal: true, nome: "TESOURO",
    };
  }
  if (r < 0.32) {
    return {
      tipo: "arena", estilo: "aberto", semente, distancia, ...dificuldade,
      quantidadeRobos: Math.min(dificuldade.quantidadeRobos + 2, 9), temCristal: false, nome: "ARENA",
    };
  }
  if (r < 0.57) {
    return { tipo: "pilares", estilo: "pilares", semente, distancia, ...dificuldade, temCristal: false, nome: "PILARES" };
  }
  return { tipo: "labirinto", estilo: "paredes", semente, distancia, ...dificuldade, temCristal: false, nome: "" };
}

// Embaralha com a semente da sala: os robôs nascem sempre nos mesmos lugares
export function embaralhar<T>(lista: T[], semente: number): T[] {
  const aleatorio = criarAleatorio(semente ^ 0x85ebca6b);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
