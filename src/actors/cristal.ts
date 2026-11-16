// src/actors/cristal.ts
import { Actor, Animation, AnimationStrategy, Collider, CollisionGroup, CollisionType, SpriteSheet, Vector } from "excalibur";
import { Resources } from "../resources";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { Jogador } from "./jogador";

// Só encosta no jogador (tiros e robôs passam direto)
const grupoCristal = CollisionGroup.collidesWith([Grupos.jogador]);

// Cristal de luz das salas de tesouro: recupera 1 de vida (issue #20)
// Desenhos do Figma: 4 quadros de 16x16 (cristal flutuando com sombra) e 4 da coleta
function animacao(imagem: typeof Resources.Cristal, tempo: number, estrategia: AnimationStrategy): Animation {
  const folha = SpriteSheet.fromImageSource({
    image: imagem,
    grid: { rows: 1, columns: 4, spriteWidth: 16, spriteHeight: 16 },
  });
  return Animation.fromSpriteSheet(folha, [0, 1, 2, 3], tempo, estrategia);
}

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
    Estado.salasLimpas.add(this.chaveSala); // não aparece de novo nesta partida

    // Coleta (Figma): clarão, o cristal vira um feixe, estoura em brilhos e vira poeira
    this.body.collisionType = CollisionType.PreventCollision;
    const coleta = animacao(Resources.CristalColeta, 90, AnimationStrategy.End);
    coleta.events.on("end", () => this.kill());
    this.graphics.use(coleta);
  }
}
