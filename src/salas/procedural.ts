// src/salas/procedural.ts
import { criarAleatorio, EstiloSala } from "./labirinto";

/*
  Cada coordenada (x, y) gera sempre a mesma sala.
  A dificuldade cresce com a distância até a sala inicial.
*/

export type TipoSala = "inicio" | "labirinto" | "pilares" | "arena" | "tesouro";

export type PlanoSala = {
  tipo: TipoSala;
  estilo: EstiloSala;
  semente: number;
  distancia: number; // salas até o início
  quantidadeRobos: number;
  velocidadeRobo: number;
  recargaRobo: number; // ms entre tiros
  temCristal: boolean;
  nome: string; // aviso ao entrar ("" = nenhum)
};

export function chaveDaSala(x: number, y: number): string {
  return `${x},${y}`;
}

// Hash das coordenadas -> semente da sala
export function sementeDaSala(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export function planejarSala(x: number, y: number): PlanoSala {
  const semente = sementeDaSala(x, y);
  const aleatorio = criarAleatorio(semente ^ 0x9e3779b9); // sequência separada da do labirinto
  const distancia = Math.abs(x) + Math.abs(y);

  const base = {
    semente,
    distancia,
    quantidadeRobos: Math.min(2 + distancia, 7),
    velocidadeRobo: Math.min(25 + distancia * 3, 50),
    recargaRobo: Math.max(1000 - distancia * 80, 450),
    temCristal: false,
    nome: "",
  };

  if (distancia === 0) return { ...base, tipo: "inicio", estilo: "paredes" };

  const r = aleatorio();
  if (r < 0.12) return { ...base, tipo: "tesouro", estilo: "pilares", quantidadeRobos: 0, temCristal: true, nome: "TESOURO" };
  if (r < 0.32) return { ...base, tipo: "arena", estilo: "aberto", quantidadeRobos: Math.min(base.quantidadeRobos + 2, 9), nome: "ARENA" };
  if (r < 0.57) return { ...base, tipo: "pilares", estilo: "pilares", nome: "PILARES" };
  return { ...base, tipo: "labirinto", estilo: "paredes" };
}

// Embaralhamento com semente (posições dos robôs sempre iguais na mesma sala)
export function embaralhar<T>(lista: T[], semente: number): T[] {
  const aleatorio = criarAleatorio(semente ^ 0x85ebca6b);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
