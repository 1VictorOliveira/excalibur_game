// src/grupos.ts
import { CollisionGroup, CollisionGroupManager } from "excalibur";

// Grupos criados pelo manager colidem com tudo, MENOS com o próprio grupo.
const jogador = CollisionGroupManager.create("jogador");
const inimigo = CollisionGroupManager.create("inimigo"); // inimigos não se empurram entre si
const parede = CollisionGroupManager.create("parede");

export const Grupos = {
  jogador,
  inimigo,
  parede,
  // Tiro do jogador: só acerta inimigos e paredes (nunca o jogador nem outras balas)
  tiroJogador: CollisionGroup.collidesWith([inimigo, parede]),
  // Tiro do inimigo: só acerta o jogador e paredes (inimigo não mata inimigo)
  tiroInimigo: CollisionGroup.collidesWith([jogador, parede]),
};
