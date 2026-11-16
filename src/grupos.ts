// src/grupos.ts
import { CollisionGroup, CollisionGroupManager } from "excalibur";

// Grupos do manager colidem com tudo, menos com o próprio grupo
const jogador = CollisionGroupManager.create("jogador");
const inimigo = CollisionGroupManager.create("inimigo");
const parede = CollisionGroupManager.create("parede");

// Robôs colidem também entre si (máscara -1)
const robo = CollisionGroupManager.create("robo", -1);

export const Grupos = {
  jogador,
  inimigo,
  parede,
  robo,
  tiroJogador: CollisionGroup.collidesWith([inimigo, parede, robo]),
  // Tiro do robô também acerta outros robôs
  tiroInimigo: CollisionGroup.collidesWith([jogador, parede, robo]),
};
