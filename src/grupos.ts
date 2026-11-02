// src/grupos.ts
import { CollisionGroup, CollisionGroupManager } from "excalibur";

// Grupos criados pelo manager colidem com tudo, MENOS com o próprio grupo.
const jogador = CollisionGroupManager.create("jogador");
const inimigo = CollisionGroupManager.create("inimigo");
const parede = CollisionGroupManager.create("parede");

// Grupo especial para robôs: colide com jogador, paredes, outros robôs E tiros
// Criado manualmente com bitmask para incluir a si mesmo
// mask 0xFFFFFFFF faz colidir com qualquer categoria (incluindo tiros)
const robo = new CollisionGroup("robo", 0b1000, 0xFFFFFFFF);

export const Grupos = {
  jogador,
  inimigo,
  parede,
  robo, // robôs colidem entre si para se autodestruírem
  // Tiro do jogador: só acerta inimigos, robôs e paredes (nunca o jogador nem outras balas)
  tiroJogador: CollisionGroup.collidesWith([inimigo, parede, robo]),
  // Tiro do inimigo: acerta o jogador, paredes E outros robôs (fogo amigo)
  tiroInimigo: CollisionGroup.collidesWith([jogador, parede, robo]),
};
