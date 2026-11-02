// src/dano.ts
import { Entity } from "excalibur";

// Tudo que pode levar tiro (jogador, inimigos...) implementa essa interface.
export interface Danificavel {
  levarDano(quantidade: number): void;
}

export function podeLevarDano(e: Entity): e is Entity & Danificavel {
  return typeof (e as Partial<Danificavel>).levarDano === "function";
}
