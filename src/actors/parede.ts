import { Actor, CollisionType, Color, vec } from "excalibur";

export class Parede extends Actor {
  constructor(x: number, y: number, largura: number, altura: number) {
    super({
      name: "parede",
      pos: vec(x, y),
      anchor: vec(0, 0), // (x, y) = canto superior esquerdo, facilita montar a sala
      width: largura,
      height: altura,
      color: Color.fromHex("#2b4ad8"),
      collisionType: CollisionType.Fixed, // nunca se move e bloqueia quem é Active
    });
  }
}
