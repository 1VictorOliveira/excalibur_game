// src/actors/jogador.ts
import {
  Actor,
  Animation,
  CollisionType,
  Color,
  EmitterType,
  Engine,
  Keys,
  ParticleEmitter,
  SpriteSheet,
  Vector,
  vec,
} from "excalibur";
import { Recursos } from "../recursos";
import { Bala } from "./bala";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";

export class Jogador extends Actor implements Danificavel {
  velocidade = 90; // pixels por segundo
  direcao = vec(1, 0); // última direção andada
  recargaTiro = 250; // ms entre um tiro e outro
  hpMax = 3;
  hp = this.hpMax;
  private tempoRecarga = 0;
  private tempoInvencibilidade = 0;
  private invencivel = false;
  private rastro!: ParticleEmitter;

  constructor(pos: Vector) {
    super({
      name: "jogador",
      pos,
      width: 10, // caixa de colisão menor que o desenho (24x24): só o núcleo da luz encosta
      height: 10,
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.jogador,
    });
  }

  override onInitialize(): void {
    // ---------- Sprite: spritesheet 96x48 = 4 colunas x 2 linhas de 24x24 ----------
    const folha = SpriteSheet.fromImageSource({
      image: Recursos.Luz,
      grid: { rows: 2, columns: 4, spriteWidth: 24, spriteHeight: 24 },
    });
    // Linha 1 (quadros 0 a 3): brilho parado. A linha 2 (4 a 7) é a carga do tiro, para depois.
    const brilho = Animation.fromSpriteSheet(folha, [0, 1, 2, 3], 150);
    this.graphics.use(brilho);

    // ---------- Rastro de partículas: mostra para onde a luz está indo ----------
    this.rastro = new ParticleEmitter({
      emitterType: EmitterType.Circle,
      radius: 3,
      emitRate: 45, // partículas por segundo
      isEmitting: false, // só liga quando estiver se movendo
      particle: {
        life: 450, // ms até sumir
        minSpeed: 2,
        maxSpeed: 10,
        minSize: 1,
        maxSize: 2,
        beginColor: Color.fromHex("#fff4b0"), // amarelo claro, igual ao núcleo
        endColor: Color.fromHex("#8c61d4"), // termina violeta, igual às pontas
        fade: true,
      },
    });
    this.rastro.z = -1; // partículas ficam atrás da luz
    this.addChild(this.rastro);
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    // Atualiza invencibilidade
    if (this.invencivel) {
      this.tempoInvencibilidade -= elapsed;
      if (this.tempoInvencibilidade <= 0) {
        this.invencivel = false;
      }
    }

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

    // Parada: só brilha. Andando: solta o rastro.
    this.rastro.isEmitting = mov.size > 0;

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

  levarDano(quantidade: number): void {
    if (this.invencivel) return;
    
    this.hp -= quantidade;
    
    if (this.hp <= 0) {
      this.kill();
    } else {
      // Blink e invencibilidade temporária (1 segundo)
      this.actions.blink(80, 80, 5);
      this.invencivel = true;
      this.tempoInvencibilidade = 1000;
    }
  }
}
