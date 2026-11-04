// src/salas/labirinto.ts
import { Engine, Scene, Vector, vec } from "excalibur";
import { Parede } from "../actors/parede";

/*
  Labirinto no estilo do Berzerk original:
  - A sala é dividida em 5 colunas x 3 linhas de células.
  - Nos 8 cruzamentos internos existem "pilares".
  - Cada pilar solta UMA parede para cima, baixo, esquerda ou direita, sorteada.
  - Se o sorteio fechar alguma célula (área sem saída), sorteia de novo.
*/

export const COLUNAS = 5;
export const LINHAS = 3;

export type Portas = { cima: boolean; baixo: boolean; esquerda: boolean; direita: boolean };

export type OpcoesLabirinto = {
  semente?: number; // mesma semente = mesmo labirinto (útil na transição entre salas)
  portas?: Partial<Portas>; // quais saídas ficam abertas (padrão: todas)
  espessura?: number;
  larguraPorta?: number;
};

export type ResultadoLabirinto = {
  centroDaCelula: (coluna: number, linha: number) => Vector;
};

type Direcao = "N" | "S" | "L" | "O";
const DIRECOES: Direcao[] = ["N", "S", "L", "O"];

// Gerador de números aleatórios com semente (mulberry32)
function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Quais duas células cada parede de pilar separa
function celulasSeparadas(i: number, j: number, d: Direcao): [string, string] {
  const id = (c: number, l: number) => `${c},${l}`;
  switch (d) {
    case "N": return [id(i - 1, j - 1), id(i, j - 1)];
    case "S": return [id(i - 1, j), id(i, j)];
    case "O": return [id(i - 1, j - 1), id(i - 1, j)];
    case "L": return [id(i, j - 1), id(i, j)];
  }
}

// Confere se dá para chegar em todas as células a partir da primeira
function todasConectadas(bloqueios: Set<string>): boolean {
  const visitadas = new Set<string>(["0,0"]);
  const fila: [number, number][] = [[0, 0]];
  while (fila.length) {
    const [c, l] = fila.shift()!;
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= COLUNAS || nl >= LINHAS) continue;
      const chave = [`${c},${l}`, `${nc},${nl}`].sort().join("|");
      const id = `${nc},${nl}`;
      if (bloqueios.has(chave) || visitadas.has(id)) continue;
      visitadas.add(id);
      fila.push([nc, nl]);
    }
  }
  return visitadas.size === COLUNAS * LINHAS;
}

export function montarLabirinto(cena: Scene, engine: Engine, opcoes: OpcoesLabirinto = {}): ResultadoLabirinto {
  const L = engine.drawWidth; // 320
  const A = engine.drawHeight; // 180
  const e = opcoes.espessura ?? 6;
  const porta = opcoes.larguraPorta ?? 40;
  const portas: Portas = { cima: true, baixo: true, esquerda: true, direita: true, ...opcoes.portas };
  const aleatorio = criarAleatorio(opcoes.semente ?? Math.floor(Math.random() * 1e9));

  const cw = L / COLUNAS; // largura da célula (64)
  const ch = A / LINHAS; // altura da célula (60)

  // ---------- Bordas, com buraco no meio quando a porta está aberta ----------
  const meioX = (L - porta) / 2;
  const meioY = (A - porta) / 2;

  if (portas.cima) {
    cena.add(new Parede(0, 0, meioX, e));
    cena.add(new Parede(meioX + porta, 0, meioX, e));
  } else cena.add(new Parede(0, 0, L, e));

  if (portas.baixo) {
    cena.add(new Parede(0, A - e, meioX, e));
    cena.add(new Parede(meioX + porta, A - e, meioX, e));
  } else cena.add(new Parede(0, A - e, L, e));

  if (portas.esquerda) {
    cena.add(new Parede(0, 0, e, meioY));
    cena.add(new Parede(0, meioY + porta, e, meioY));
  } else cena.add(new Parede(0, 0, e, A));

  if (portas.direita) {
    cena.add(new Parede(L - e, 0, e, meioY));
    cena.add(new Parede(L - e, meioY + porta, e, meioY));
  } else cena.add(new Parede(L - e, 0, e, A));

  // ---------- Sorteio das paredes dos pilares ----------
  let escolhas: { i: number; j: number; d: Direcao }[] = [];
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    escolhas = [];
    const bloqueios = new Set<string>();
    for (let i = 1; i < COLUNAS; i++) {
      for (let j = 1; j < LINHAS; j++) {
        const d = DIRECOES[Math.floor(aleatorio() * DIRECOES.length)];
        escolhas.push({ i, j, d });
        bloqueios.add(celulasSeparadas(i, j, d).sort().join("|"));
      }
    }
    if (todasConectadas(bloqueios)) break;
  }

  // ---------- Cria as paredes internas ----------
  for (const { i, j, d } of escolhas) {
    const x = i * cw;
    const y = j * ch;
    const m = e / 2; // centraliza a espessura na linha do pilar
    switch (d) {
      case "N": cena.add(new Parede(x - m, y - ch, e, ch + m)); break;
      case "S": cena.add(new Parede(x - m, y - m, e, ch + m)); break;
      case "O": cena.add(new Parede(x - cw, y - m, cw + m, e)); break;
      case "L": cena.add(new Parede(x - m, y - m, cw + m, e)); break;
    }
  }

  return {
    centroDaCelula: (coluna, linha) => vec(coluna * cw + cw / 2, linha * ch + ch / 2),
  };
}
