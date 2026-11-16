// src/salas/aparencia.ts
import { Actor, CollisionType, ImageSource, Scene, vec } from "excalibur";
import { Resources } from "../resources";
import { TipoBloco } from "../actors/parede";
import { TipoSala } from "./procedural";

const FUNDOS: Record<TipoSala, ImageSource> = {
  inicio: Resources.FundoInicio,
  labirinto: Resources.FundoLabirinto,
  pilares: Resources.FundoLabirinto,
  arena: Resources.FundoArena,
  tesouro: Resources.FundoTesouro,
};

const PILARES: Record<TipoSala, TipoBloco> = {
  inicio: "runa",
  labirinto: "runa",
  pilares: "runa",
  arena: "demonio",
  tesouro: "luz",
};

export function blocoPilarDa(tipo: TipoSala): TipoBloco {
  return PILARES[tipo];
}

// Chão da sala (imagem 320x180 atrás de tudo)
export function montarChao(cena: Scene, tipo: TipoSala): void {
  const chao = new Actor({ pos: vec(0, 0), anchor: vec(0, 0), z: -100, collisionType: CollisionType.PreventCollision });
  chao.graphics.use(FUNDOS[tipo].toSprite());
  cena.add(chao);
}
