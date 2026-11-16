// src/salas/labirinto.ts
import { Engine, Scene, Vector, vec } from "excalibur";
import { ESPESSURA_PAREDE, Parede, TipoBloco } from "../actors/parede";

/*
  Estilos de sala:
  - paredes: labirinto do Berzerk (5 x 3 células; cada pilar interno solta uma parede)
  - pilares: só os blocos dos cruzamentos
  - aberto: dois blocos de cobertura
*/

export const COLUNAS = 5;
export const LINHAS = 3;

export type Portas = { cima: boolean; baixo: boolean; esquerda: boolean; direita: boolean };

export type EstiloSala = "paredes" | "pilares" | "aberto";

export type OpcoesLabirinto = {
  estilo?: EstiloSala;
  semente?: number; // mesma semente = mesmo labirinto
  portas?: Partial<Portas>; // padrão: todas abertas
  larguraPorta?: number;
  blocoPilar?: TipoBloco; // bloco dos pilares e coberturas
};

export type Celula = [coluna: number, linha: number];

export type ResultadoLabirinto = {
  centroDaCelula: (coluna: number, linha: number) => Vector;
  celulaDe: (pos: Vector) => Celula;
  // Próxima célula no menor caminho (null = sem caminho ou já chegou)
  proximaCelula: (de: Celula, para: Celula) => Celula | null;
};

type Direcao = "N" | "S" | "L" | "O";
const DIRECOES: Direcao[] = ["N", "S", "L", "O"];
const VIZINHOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Gerador pseudoaleatório com semente (mulberry32)
export function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const id = (c: number, l: number) => `${c},${l}`;

function chaveEntre(a: Celula, b: Celula): string {
  return [id(a[0], a[1]), id(b[0], b[1])].sort().join("|");
}

// Células separadas pela parede que sai do pilar (i, j) na direção d
function celulasSeparadas(i: number, j: number, d: Direcao): string {
  switch (d) {
    case "N": return chaveEntre([i - 1, j - 1], [i, j - 1]);
    case "S": return chaveEntre([i - 1, j], [i, j]);
    case "O": return chaveEntre([i - 1, j - 1], [i - 1, j]);
    case "L": return chaveEntre([i, j - 1], [i, j]);
  }
}

function dentro(c: Celula): boolean {
  return c[0] >= 0 && c[1] >= 0 && c[0] < COLUNAS && c[1] < LINHAS;
}

// BFS entre células: devolve o primeiro passo do menor caminho
function proximaCelulaNoCaminho(de: Celula, para: Celula, bloqueios: Set<string>): Celula | null {
  if (de[0] === para[0] && de[1] === para[1]) return null;
  const anterior = new Map<string, Celula | null>([[id(de[0], de[1]), null]]);
  const fila: Celula[] = [de];
  while (fila.length) {
    const atual = fila.shift()!;
    if (atual[0] === para[0] && atual[1] === para[1]) {
      let passo = atual;
      let pai = anterior.get(id(passo[0], passo[1]))!;
      while (pai && !(pai[0] === de[0] && pai[1] === de[1])) {
        passo = pai;
        pai = anterior.get(id(passo[0], passo[1]))!;
      }
      return passo;
    }
    for (const [dc, dl] of VIZINHOS) {
      const vizinho: Celula = [atual[0] + dc, atual[1] + dl];
      const chave = id(vizinho[0], vizinho[1]);
      if (!dentro(vizinho) || anterior.has(chave) || bloqueios.has(chaveEntre(atual, vizinho))) continue;
      anterior.set(chave, atual);
      fila.push(vizinho);
    }
  }
  return null;
}

// Todas as células alcançáveis a partir de (0, 0)?
function todasConectadas(bloqueios: Set<string>): boolean {
  const visitadas = new Set<string>([id(0, 0)]);
  const fila: Celula[] = [[0, 0]];
  while (fila.length) {
    const atual = fila.shift()!;
    for (const [dc, dl] of VIZINHOS) {
      const vizinho: Celula = [atual[0] + dc, atual[1] + dl];
      const chave = id(vizinho[0], vizinho[1]);
      if (!dentro(vizinho) || visitadas.has(chave) || bloqueios.has(chaveEntre(atual, vizinho))) continue;
      visitadas.add(chave);
      fila.push(vizinho);
    }
  }
  return visitadas.size === COLUNAS * LINHAS;
}

// Bordas da sala, com abertura no meio de cada lado com porta
function montarBordas(cena: Scene, L: number, A: number, portas: Portas, porta: number): void {
  const e = ESPESSURA_PAREDE;
  const meioX = (L - porta) / 2;
  const meioY = (A - porta) / 2;
  const horizontal = (y: number, aberta: boolean) => {
    if (!aberta) return cena.add(new Parede(0, y, L, e));
    cena.add(new Parede(0, y, meioX, e));
    cena.add(new Parede(meioX + porta, y, meioX, e));
  };
  // As laterais ficam entre as bordas de cima e de baixo
  const vertical = (x: number, aberta: boolean) => {
    if (!aberta) return cena.add(new Parede(x, e, e, A - 2 * e));
    cena.add(new Parede(x, e, e, meioY - e));
    cena.add(new Parede(x, meioY + porta, e, meioY - e));
  };
  horizontal(0, portas.cima);
  horizontal(A - e, portas.baixo);
  vertical(0, portas.esquerda);
  vertical(L - e, portas.direita);
}

export function montarLabirinto(cena: Scene, engine: Engine, opcoes: OpcoesLabirinto = {}): ResultadoLabirinto {
  const L = engine.drawWidth; // 320
  const A = engine.drawHeight; // 180
  const e = ESPESSURA_PAREDE;
  const portas: Portas = { cima: true, baixo: true, esquerda: true, direita: true, ...opcoes.portas };
  const aleatorio = criarAleatorio(opcoes.semente ?? Math.floor(Math.random() * 1e9));
  const blocoPilar = opcoes.blocoPilar ?? "runa";
  const cw = L / COLUNAS; // 64
  const ch = A / LINHAS; // 60

  montarBordas(cena, L, A, portas, opcoes.larguraPorta ?? 40);

  const bloqueiosFinais = new Set<string>();
  const resultado: ResultadoLabirinto = {
    centroDaCelula: (coluna, linha) => vec(coluna * cw + cw / 2, linha * ch + ch / 2),
    celulaDe: (pos) => [
      Math.max(0, Math.min(COLUNAS - 1, Math.floor(pos.x / cw))),
      Math.max(0, Math.min(LINHAS - 1, Math.floor(pos.y / ch))),
    ],
    proximaCelula: (de, para) => proximaCelulaNoCaminho(de, para, bloqueiosFinais),
  };

  const estilo = opcoes.estilo ?? "paredes";
  if (estilo === "pilares") {
    for (let i = 1; i < COLUNAS; i++) {
      for (let j = 1; j < LINHAS; j++) cena.add(Parede.bloco(vec(i * cw, j * ch), blocoPilar));
    }
    return resultado;
  }
  if (estilo === "aberto") {
    cena.add(Parede.bloco(vec(2 * cw, ch), blocoPilar));
    cena.add(Parede.bloco(vec(3 * cw, 2 * ch), blocoPilar));
    return resultado;
  }

  // Sorteia uma parede por pilar até nenhuma célula ficar isolada
  let escolhas: { i: number; j: number; d: Direcao }[] = [];
  let bloqueios = new Set<string>();
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    escolhas = [];
    bloqueios = new Set<string>();
    for (let i = 1; i < COLUNAS; i++) {
      for (let j = 1; j < LINHAS; j++) {
        const d = DIRECOES[Math.floor(aleatorio() * DIRECOES.length)];
        escolhas.push({ i, j, d });
        bloqueios.add(celulasSeparadas(i, j, d));
      }
    }
    if (todasConectadas(bloqueios)) break;
  }
  for (const b of bloqueios) bloqueiosFinais.add(b);

  // Paredes internas: do pilar até o próximo cruzamento (ou a borda)
  const m = e / 2;
  for (const { i, j, d } of escolhas) {
    const x = i * cw;
    const y = j * ch;
    switch (d) {
      case "N": cena.add(new Parede(x - m, y - ch, e, ch + m)); break;
      case "S": cena.add(new Parede(x - m, y - m, e, ch + m)); break;
      case "O": cena.add(new Parede(x - cw, y - m, cw + m, e)); break;
      case "L": cena.add(new Parede(x - m, y - m, cw + m, e)); break;
    }
  }

  return resultado;
}
