// src/salas/labirinto.ts
import { Engine, Scene, Vector, vec } from "excalibur";
import { Parede } from "../actors/parede";

/*
  Estilos de sala (issue #20):
  - "paredes": labirinto no estilo do Berzerk original (padrão)
  - "pilares": só blocos nos cruzamentos, sem paredes ligando -> muitos caminhos
  - "aberto": arena quase vazia, com 2 blocos de cobertura

  Labirinto no estilo do Berzerk original:
  - A sala é dividida em 5 colunas x 3 linhas de células.
  - Nos 8 cruzamentos internos existem "pilares".
  - Cada pilar solta UMA parede para cima, baixo, esquerda ou direita, sorteada.
  - Se o sorteio fechar alguma célula (área sem saída), sorteia de novo.
*/

export const COLUNAS = 5;
export const LINHAS = 3;

export type Portas = { cima: boolean; baixo: boolean; esquerda: boolean; direita: boolean };

export type EstiloSala = "paredes" | "pilares" | "aberto";

export type OpcoesLabirinto = {
  estilo?: EstiloSala;
  semente?: number; // mesma semente = mesmo labirinto (útil na transição entre salas)
  portas?: Partial<Portas>; // quais saídas ficam abertas (padrão: todas)
  espessura?: number;
  larguraPorta?: number;
};

export type Celula = [coluna: number, linha: number];

export type ResultadoLabirinto = {
  centroDaCelula: (coluna: number, linha: number) => Vector;
  // Navegação para a IA dos inimigos
  celulaDe: (pos: Vector) => Celula;
  // Próxima célula no caminho mais curto (null = não há caminho ou já está na célula)
  proximaCelula: (de: Celula, para: Celula) => Celula | null;
};

type Direcao = "N" | "S" | "L" | "O";
const DIRECOES: Direcao[] = ["N", "S", "L", "O"];

// Gerador de números aleatórios com semente (mulberry32)
export function criarAleatorio(semente: number): () => number {
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

function chaveEntre(a: Celula, b: Celula): string {
  return [`${a[0]},${a[1]}`, `${b[0]},${b[1]}`].sort().join("|");
}

// Busca em largura (BFS) pelas células, respeitando as paredes entre elas.
// Devolve a primeira célula do caminho mais curto de "de" até "para".
function proximaCelulaNoCaminho(de: Celula, para: Celula, bloqueios: Set<string>): Celula | null {
  if (de[0] === para[0] && de[1] === para[1]) return null;
  const anterior = new Map<string, Celula | null>([[`${de[0]},${de[1]}`, null]]);
  const fila: Celula[] = [de];
  while (fila.length) {
    const atual = fila.shift()!;
    if (atual[0] === para[0] && atual[1] === para[1]) {
      // Volta pelo caminho até achar o passo logo depois da origem
      let passo = atual;
      let pai = anterior.get(`${passo[0]},${passo[1]}`)!;
      while (pai && !(pai[0] === de[0] && pai[1] === de[1])) {
        passo = pai;
        pai = anterior.get(`${passo[0]},${passo[1]}`)!;
      }
      return passo;
    }
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const vizinho: Celula = [atual[0] + dc, atual[1] + dl];
      if (vizinho[0] < 0 || vizinho[1] < 0 || vizinho[0] >= COLUNAS || vizinho[1] >= LINHAS) continue;
      const id = `${vizinho[0]},${vizinho[1]}`;
      if (anterior.has(id) || bloqueios.has(chaveEntre(atual, vizinho))) continue;
      anterior.set(id, atual);
      fila.push(vizinho);
    }
  }
  return null;
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

  // Paredes entre células (só o estilo "paredes" tem; nos outros tudo é aberto)
  const bloqueiosFinais = new Set<string>();
  const resultado: ResultadoLabirinto = {
    centroDaCelula: (coluna, linha) => vec(coluna * cw + cw / 2, linha * ch + ch / 2),
    celulaDe: (pos) => [
      Math.max(0, Math.min(COLUNAS - 1, Math.floor(pos.x / cw))),
      Math.max(0, Math.min(LINHAS - 1, Math.floor(pos.y / ch))),
    ],
    proximaCelula: (de, para) => proximaCelulaNoCaminho(de, para, bloqueiosFinais),
  };

  // ---------- Estilos sem labirinto ----------
  const bloco = 10; // tamanho do bloco de pilar
  const estilo = opcoes.estilo ?? "paredes";
  if (estilo === "pilares") {
    for (let i = 1; i < COLUNAS; i++) {
      for (let j = 1; j < LINHAS; j++) {
        cena.add(new Parede(i * cw - bloco / 2, j * ch - bloco / 2, bloco, bloco));
      }
    }
    return resultado;
  }
  if (estilo === "aberto") {
    // Dois blocos de cobertura, em diagonal, para a arena não ficar 100% vazia
    cena.add(new Parede(2 * cw - bloco / 2, 1 * ch - bloco / 2, bloco, bloco));
    cena.add(new Parede(3 * cw - bloco / 2, 2 * ch - bloco / 2, bloco, bloco));
    return resultado;
  }

  // ---------- Sorteio das paredes dos pilares ----------
  let escolhas: { i: number; j: number; d: Direcao }[] = [];
  let bloqueios = new Set<string>();
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    escolhas = [];
    bloqueios = new Set<string>();
    for (let i = 1; i < COLUNAS; i++) {
      for (let j = 1; j < LINHAS; j++) {
        const d = DIRECOES[Math.floor(aleatorio() * DIRECOES.length)];
        escolhas.push({ i, j, d });
        bloqueios.add(celulasSeparadas(i, j, d).sort().join("|"));
      }
    }
    if (todasConectadas(bloqueios)) break;
  }
  for (const b of bloqueios) bloqueiosFinais.add(b);

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

  return resultado;
}
