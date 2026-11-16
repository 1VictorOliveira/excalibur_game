// src/actors/cristal.ts
import { Actor, Animation, AnimationStrategy, Collider, CollisionGroup, CollisionType, SpriteSheet, Vector } from "excalibur";
import { Resources } from "../resources";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { Jogador } from "./jogador";

// Só colide com o jogador
const grupoCristal = CollisionGroup.collidesWith([Grupos.jogador]);

function animacao(imagem: typeof Resources.Cristal, tempo: number, estrategia: AnimationStrategy): Animation {
  const folha = SpriteSheet.fromImageSource({
    image: imagem,
    grid: { rows: 1, columns: 4, spriteWidth: 16, spriteHeight: 16 },
  });
  return Animation.fromSpriteSheet(folha, [0, 1, 2, 3], tempo, estrategia);
}

// Cristal das salas de tesouro: recupera 1 de vida
export class Cristal extends Actor {
  private pego = false;

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
    this.graphics.use(animacao(Resources.Cristal, 160, AnimationStrategy.Loop));
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    const jogador = outro.owner;
    if (!(jogador instanceof Jogador) || this.pego) return;
    this.pego = true;
    jogador.hp = Math.min(jogador.hpMax, jogador.hp + 1);
    Estado.hp = jogador.hp;
    Estado.salasLimpas.add(this.chaveSala);

    this.body.collisionType = CollisionType.PreventCollision;
    const coleta = animacao(Resources.CristalColeta, 90, AnimationStrategy.End);
    coleta.events.on("end", () => this.kill());
    this.graphics.use(coleta);
  }
}
