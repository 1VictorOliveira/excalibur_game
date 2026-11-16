// src/grupos.ts
import { CollisionGroup, CollisionGroupManager } from "excalibur";

// Grupos criados pelo manager colidem com tudo, MENOS com o próprio grupo.
const jogador = CollisionGroupManager.create("jogador");
const inimigo = CollisionGroupManager.create("inimigo");
const parede = CollisionGroupManager.create("parede");

// Robôs colidem com tudo, inclusive entre si (um empurra o outro, ninguém se sobrepõe).
// Máscara -1 = todos os bits. Criado PELO manager, para ganhar um bit só dele.
// (Antes era new CollisionGroup("robo", 0b1000, ...) com bit fixo, e o manager dava
// esse MESMO bit ao tiro do jogador logo abaixo: os dois grupos ficavam iguais.)
const robo = CollisionGroupManager.create("robo", -1);

export const Grupos = {
  jogador,
  inimigo,
  parede,
  robo,
  // Tiro do jogador: só acerta inimigos, robôs e paredes (nunca o jogador nem outras balas)
  tiroJogador: CollisionGroup.collidesWith([inimigo, parede, robo]),
  // Tiro do inimigo: acerta o jogador, paredes E outros robôs (fogo amigo)
  tiroInimigo: CollisionGroup.collidesWith([jogador, parede, robo]),
};
