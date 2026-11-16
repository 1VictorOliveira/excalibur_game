// src/dano.ts
import { Entity } from "excalibur";

// Implementado por tudo que pode levar dano
export interface Danificavel {
  levarDano(quantidade: number): void;
}

export function podeLevarDano(e: Entity): e is Entity & Danificavel {
  return typeof (e as Partial<Danificavel>).levarDano === "function";
}
