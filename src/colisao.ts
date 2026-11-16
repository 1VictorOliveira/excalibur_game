// src/colisao.ts
import { BoundingBox, Scene, Vector, vec } from "excalibur";
import { Parede } from "./actors/parede";

/*
  Colisão varrida dos projéteis contra as paredes.
  Antes de mover, o caminho do quadro é testado contra todas as paredes
  e só a primeira batida conta (evita atravessar parede em quadro lento
  e refletir duas vezes numa quina).
*/

export type Batida = {
  avanco: number; // distância até encostar
  normal: Vector; // normal da face atingida
};

export function paredesDaCena(cena: Scene): BoundingBox[] {
  return cena.actors.filter((a) => a instanceof Parede).map((p) => p.collider.bounds);
}

// Segmento contra cada parede expandida pelo raio do projétil (método slab)
export function primeiraBatida(
  paredes: BoundingBox[],
  origem: Vector,
  dir: Vector,
  distancia: number,
  raio: number,
): Batida | null {
  let melhor: Batida | null = null;
  for (const b of paredes) {
    const esq = b.left - raio, dir_ = b.right + raio, topo = b.top - raio, baixo = b.bottom + raio;

    let entradaX = -Infinity, saidaX = Infinity, entradaY = -Infinity, saidaY = Infinity;
    if (dir.x !== 0) {
      const t1 = (esq - origem.x) / dir.x, t2 = (dir_ - origem.x) / dir.x;
      entradaX = Math.min(t1, t2);
      saidaX = Math.max(t1, t2);
    } else if (origem.x <= esq || origem.x >= dir_) continue;
    if (dir.y !== 0) {
      const t1 = (topo - origem.y) / dir.y, t2 = (baixo - origem.y) / dir.y;
      entradaY = Math.min(t1, t2);
      saidaY = Math.max(t1, t2);
    } else if (origem.y <= topo || origem.y >= baixo) continue;

    const entrada = Math.max(entradaX, entradaY);
    const saida = Math.min(saidaX, saidaY);
    if (entrada > saida || saida < 0) continue; // não cruza
    if (entrada < 0) {
      // Já encostado (quina): batida imediata se estiver entrando
      const faces: [number, Vector][] = [
        [origem.x - esq, vec(-1, 0)],
        [dir_ - origem.x, vec(1, 0)],
        [origem.y - topo, vec(0, -1)],
        [baixo - origem.y, vec(0, 1)],
      ];
      const [, normalMaisProxima] = faces.reduce((a, b) => (b[0] < a[0] ? b : a));
      if (dir.dot(normalMaisProxima) < 0 && (!melhor || melhor.avanco > 0)) {
        melhor = { avanco: 0, normal: normalMaisProxima };
      }
      continue;
    }
    if (entrada > distancia) continue;

    // Face atingida = eixo que entrou por último
    const normal = entradaX > entradaY ? vec(-Math.sign(dir.x), 0) : vec(0, -Math.sign(dir.y));
    if (!melhor || entrada < melhor.avanco) melhor = { avanco: entrada, normal };
  }
  return melhor;
}

// Reflexão: v' = v - 2 (v · n) n
export function refletir(dir: Vector, normal: Vector): Vector {
  return dir.sub(normal.scale(2 * dir.dot(normal)));
}

// Caminho livre entre quem atira e o ponto onde o tiro nasce
export function saidaLivre(cena: Scene, origem: Vector, dir: Vector, distancia: number, raio: number): boolean {
  return primeiraBatida(paredesDaCena(cena), origem, dir.normalize(), distancia, raio) === null;
}
