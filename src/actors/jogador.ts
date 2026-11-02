import { Actor, CollisionType, Color, Engine, Keys, Vector, vec } from "excalibur";

export class Jogador extends Actor {
  velocidade = 90; // pixels por segundo
  direcao = vec(1, 0); // última direção andada (vai servir pra mira na issue #4)

  constructor(pos: Vector) {
    super({
      name: "jogador",
      pos,
      width: 10,
      height: 14,
      color: Color.fromHex("#5ad45a"),
      collisionType: CollisionType.Active, // se move e é bloqueado por paredes
    });
  }

  override onPreUpdate(engine: Engine): void {
    const k = engine.input.keyboard;
    const mov = vec(0, 0);

    if (k.isHeld(Keys.A) || k.isHeld(Keys.Left)) mov.x -= 1;
    if (k.isHeld(Keys.D) || k.isHeld(Keys.Right)) mov.x += 1;
    if (k.isHeld(Keys.W) || k.isHeld(Keys.Up)) mov.y -= 1;
    if (k.isHeld(Keys.S) || k.isHeld(Keys.Down)) mov.y += 1;

    if (mov.size > 0) {
      // normalize: na diagonal ele não anda mais rápido que na reta
      this.direcao = mov.normalize();
      this.vel = this.direcao.scale(this.velocidade);
    } else {
      this.vel = vec(0, 0);
    }
  }
}
