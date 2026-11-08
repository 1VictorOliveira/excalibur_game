// src/actors/cristal.ts
import { Actor, Collider, CollisionGroup, CollisionType, Color, Engine, Polygon, vec, Vector } from "excalibur";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { Jogador } from "./jogador";

// Só encosta no jogador (tiros e robôs passam direto)
const grupoCristal = CollisionGroup.collidesWith([Grupos.jogador]);

// Cristal de luz das salas de tesouro: recupera 1 de vida (issue #20)
export class Cristal extends Actor {
  private tempo = 0;

  constructor(
    pos: Vector,
    private chaveSala: string,
  ) {
    super({
      name: "cristal",
      pos,
      width: 8,
      height: 10,
      collisionType: CollisionType.Passive,
      collisionGroup: grupoCristal,
    });
  }

  override onInitialize(): void {
    // Losango amarelo
    this.graphics.use(
      new Polygon({
        points: [vec(4, 0), vec(8, 5), vec(4, 10), vec(0, 5)],
        color: Color.fromHex("#fff4b0"),
      }),
    );
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;
    this.graphics.opacity = 0.6 + 0.4 * Math.sin(this.tempo * 5); // pulsa
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    const jogador = outro.owner;
    if (!(jogador instanceof Jogador)) return;
    jogador.hp = Math.min(jogador.hpMax, jogador.hp + 1);
    Estado.hp = jogador.hp;
    Estado.salasLimpas.add(this.chaveSala); // não aparece de novo nesta partida
    this.kill();
  }
}
