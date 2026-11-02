// src/grupos.ts
import { CollisionGroup, CollisionGroupManager } from "excalibur";

// Grupos criados pelo manager colidem com tudo, MENOS com o próprio grupo.
const jogador = CollisionGroupManager.create("jogador");
const inimigo = CollisionGroupManager.create("inimigo");
const parede = CollisionGroupManager.create("parede");

// Grupo especial para robôs: colide com jogador, paredes E outros robôs (para autodestruição)
// Criado manualmente com bitmask para incluir a si mesmo
const robo = new CollisionGroup("robo", 0b1000, 0b1111); // colide com tudo incluindo outros robôs

export const Grupos = {
  jogador,
  inimigo,
  parede,
  robo, // robôs colidem entre si para se autodestruírem
  // Tiro do jogador: só acerta inimigos, robôs e paredes (nunca o jogador nem outras balas)
  tiroJogador: CollisionGroup.collidesWith([inimigo, parede, robo]),
  // Tiro do inimigo: só acerta o jogador e paredes (inimigo não mata inimigo)
  tiroInimigo: CollisionGroup.collidesWith([jogador, parede]),
};
