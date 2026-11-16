// src/salas/procedural.ts
import { Celula, criarAleatorio, EstiloSala } from "./labirinto";

/*
  Cada coordenada (x, y) gera sempre a mesma sala.
  A dificuldade cresce com a distância até a sala inicial.
*/

export type TipoSala = "inicio" | "labirinto" | "pilares" | "arena" | "tesouro";
export type TipoInimigo = "diabrete" | "anjo-caido" | "arquidemonio";
export type SpawnInimigo = { tipo: TipoInimigo; celula: Celula };

export type PlanoSala = {
  tipo: TipoSala;
  estilo: EstiloSala;
  semente: number;
  distancia: number; // salas até o início
  quantidadeDiabretes: number;
  temCristal: boolean;
  inimigos: SpawnInimigo[];
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

function finalizarPlano(plano: Omit<PlanoSala, "inimigos">): PlanoSala {
  const inimigos: SpawnInimigo[] = [];
  if (plano.tipo !== "tesouro") {
    if (plano.distancia === 0) inimigos.push({ tipo: "diabrete", celula: [4, 1] });
    if (plano.distancia >= 2) inimigos.push({ tipo: "anjo-caido", celula: [2, 0] });
    if (plano.distancia >= 4) inimigos.push({ tipo: "arquidemonio", celula: [2, 2] });
  }
  return {
    ...plano,
    inimigos,
    quantidadeDiabretes: Math.max(0, plano.quantidadeDiabretes - inimigos.length),
  };
}

export function planejarSala(x: number, y: number): PlanoSala {
  const semente = sementeDaSala(x, y);
  const aleatorio = criarAleatorio(semente ^ 0x9e3779b9); // sequência separada da do labirinto
  const distancia = Math.abs(x) + Math.abs(y);

  const base = {
    semente,
    distancia,
    quantidadeDiabretes: Math.min(2 + distancia, 7),
    temCristal: false,
    nome: "",
  };

  if (distancia === 0) return finalizarPlano({ ...base, tipo: "inicio", estilo: "paredes" });

  const r = aleatorio();
  if (r < 0.12) {
    return finalizarPlano({
      ...base, tipo: "tesouro", estilo: "pilares", quantidadeDiabretes: 0, temCristal: true, nome: "TESOURO",
    });
  }
  if (r < 0.32) {
    return finalizarPlano({
      ...base, tipo: "arena", estilo: "aberto", quantidadeDiabretes: Math.min(base.quantidadeDiabretes + 2, 9), nome: "ARENA",
    });
  }
  if (r < 0.57) return finalizarPlano({ ...base, tipo: "pilares", estilo: "pilares", nome: "PILARES" });
  return finalizarPlano({ ...base, tipo: "labirinto", estilo: "paredes" });
}

// Embaralhamento com semente (posições dos inimigos sempre iguais na mesma sala)
export function embaralhar<T>(lista: T[], semente: number): T[] {
  const aleatorio = criarAleatorio(semente ^ 0x85ebca6b);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
