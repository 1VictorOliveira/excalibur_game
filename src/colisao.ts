// src/colisao.ts
// Colisão "varrida" dos projéteis contra as paredes.
import { BoundingBox, Scene, Vector, vec } from "excalibur";
import { Parede } from "./actors/parede";

/*
  Por que isto existe:
  - Os tiros são corpos "Passive" no Excalibur, e a proteção contra objetos rápidos
    (continuous collision) só vale para corpos "Active". Num quadro lento, a bala
    pode pular por cima de uma parede de 6 px.
  - No ricochete, quando o feixe encostava em DUAS paredes no mesmo quadro (onde as
    paredes se encontram), a reflexão era aplicada duas vezes, uma desfazia a outra,
    e o feixe seguia reto para dentro da parede. Nos testes, 6% dos feixes atravessavam.

  Solução: antes de mover, o projétil "varre" o caminho do quadro inteiro contra as
  paredes (que são todas retângulos alinhados) e reage só à PRIMEIRA que encontrar.
*/

export type Batida = {
  avanco: number; // quanto o centro do projétil anda até encostar na parede
  normal: Vector; // direção da face atingida, apontando para fora da parede
};

export function paredesDaCena(cena: Scene): BoundingBox[] {
  return cena.actors.filter((a) => a instanceof Parede).map((p) => p.collider.bounds);
}

/*
  Testa o segmento origem -> origem + dir * distancia contra cada parede "engordada"
  pelo raio do projétil (assim um círculo vira um ponto). Método das faixas (slab).
  Ignora paredes em que a origem já está dentro e paredes de que o projétil está saindo.
*/
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
    } else if (origem.x <= esq || origem.x >= dir_) continue; // anda na vertical, fora da faixa
    if (dir.y !== 0) {
      const t1 = (topo - origem.y) / dir.y, t2 = (baixo - origem.y) / dir.y;
      entradaY = Math.min(t1, t2);
      saidaY = Math.max(t1, t2);
    } else if (origem.y <= topo || origem.y >= baixo) continue; // anda na horizontal, fora da faixa

    const entrada = Math.max(entradaX, entradaY);
    const saida = Math.min(saidaX, saidaY);
    if (entrada > saida || saida < 0) continue; // não cruza
    if (entrada < 0) {
      // Já está encostado nesta parede (acontece numa quina, logo depois de refletir na
      // parede vizinha). Se está indo mais para dentro, conta como batida imediata;
      // se está saindo, ignora.
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
    if (entrada > distancia) continue; // longe demais para este quadro

    // A face atingida é a do eixo que "entrou por último"
    const normal = entradaX > entradaY ? vec(-Math.sign(dir.x), 0) : vec(0, -Math.sign(dir.y));
    if (!melhor || entrada < melhor.avanco) melhor = { avanco: entrada, normal };
  }
  return melhor;
}

// Reflexão: v' = v - 2 (v · n) n
export function refletir(dir: Vector, normal: Vector): Vector {
  return dir.sub(normal.scale(2 * dir.dot(normal)));
}

// O ponto onde o tiro nasce (um pouco à frente de quem atira) está livre de parede?
// Sem isso, quem atirava colado numa quina podia "teleportar" a bala para o outro lado.
export function saidaLivre(cena: Scene, origem: Vector, dir: Vector, distancia: number, raio: number): boolean {
  return primeiraBatida(paredesDaCena(cena), origem, dir.normalize(), distancia, raio) === null;
}
