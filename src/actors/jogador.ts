// src/actors/jogador.ts
import { Actor, CollisionType, Color, Engine, Keys, Vector, vec } from "excalibur";
import { Bala } from "./bala";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";

export class Jogador extends Actor implements Danificavel {
  velocidade = 90; // pixels por segundo
  direcao = vec(1, 0); // última direção andada
  recargaTiro = 250; // ms entre um tiro e outro
  private tempoRecarga = 0;

  constructor(pos: Vector) {
    super({
      name: "jogador",
      pos,
      width: 10,
      height: 14,
      color: Color.fromHex("#5ad45a"),
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.jogador,
    });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    const k = engine.input.keyboard;

    // --- Movimento: WASD (as setas agora são do tiro) ---
    const mov = vec(0, 0);
    if (k.isHeld(Keys.A)) mov.x -= 1;
    if (k.isHeld(Keys.D)) mov.x += 1;
    if (k.isHeld(Keys.W)) mov.y -= 1;
    if (k.isHeld(Keys.S)) mov.y += 1;

    if (mov.size > 0) {
      this.direcao = mov.normalize();
      this.vel = this.direcao.scale(this.velocidade);
    } else {
      this.vel = vec(0, 0);
    }

    // --- Tiro: setas em 8 direções (duas setas juntas = diagonal) ---
    const mira = vec(0, 0);
    if (k.isHeld(Keys.Left)) mira.x -= 1;
    if (k.isHeld(Keys.Right)) mira.x += 1;
    if (k.isHeld(Keys.Up)) mira.y -= 1;
    if (k.isHeld(Keys.Down)) mira.y += 1;

    // Espaço atira para onde o jogador está andando (estilo Berzerk original)
    if (mira.size === 0 && k.isHeld(Keys.Space)) mira.setTo(this.direcao.x, this.direcao.y);

    this.tempoRecarga -= elapsed;
    if (mira.size > 0 && this.tempoRecarga <= 0) {
      this.atirar(mira);
      this.tempoRecarga = this.recargaTiro;
    }
  }

  atirar(direcao: Vector): void {
    // A bala nasce um pouco à frente do jogador, não dentro dele
    const saida = this.pos.add(direcao.normalize().scale(10));
    this.scene?.add(new Bala(saida, direcao, Grupos.tiroJogador));
  }

  levarDano(_quantidade: number): void {
    // Por enquanto só pisca. A perda de vida entra na issue #13 (Sistema de Vidas).
    this.actions.blink(80, 80, 5);
  }
}
