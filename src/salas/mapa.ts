// src/salas/mapa.ts
// Gera sementes determinísticas para cada sala baseada nas coordenadas

export function sementeDaSala(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
