import { Actor, Animation, CollisionType, Color, Engine, Vector, vec } from "excalibur";
import { getAnimation } from "../../assets/animations";
import { Jogador } from "../actors/jogador";
import { Danificavel } from "../dano";
import { Estado } from "../estado";
import { Grupos } from "../grupos";
import { ENEMY_CONFIG } from "./config";

export enum EnemyPhase {
  IdleChase = "IDLE/CHASE",
  Telegraph = "TELEGRAPH",
  Attack = "ATTACK",
  Cooldown = "COOLDOWN",
}

export interface EnemyDurations {
  readonly telegraph: number;
  readonly attack: number;
  readonly cooldown: number;
}

export interface BaseEnemyOptions {
  readonly name: string;
  readonly color: Color;
  readonly hp?: number;
  readonly speed?: number;
  readonly telegraph: number;
  readonly attack?: number;
  readonly cooldown: number;
}

export abstract class BaseEnemy extends Actor implements Danificavel {
  private phase = EnemyPhase.IdleChase;
  private phaseDuration: number = ENEMY_CONFIG.shared.idleChase;
  private timer: number = this.phaseDuration;
  private durations: EnemyDurations;
  private hp: number;
  private readonly speed: number;
  private readonly telegraphVisual: Actor;
  private readonly effects = new Set<Actor>();
  private animation?: Animation;
  private destroyed = false;

  protected constructor(pos: Vector, protected readonly options: BaseEnemyOptions) {
    const shared = ENEMY_CONFIG.shared;
    super({
      name: options.name,
      pos,
      width: shared.width,
      height: shared.height,
      color: options.color,
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.robo,
    });
    this.hp = options.hp ?? shared.hp;
    this.speed = options.speed ?? shared.speed;
    this.durations = {
      telegraph: options.telegraph,
      attack: options.attack ?? shared.instantAttack,
      cooldown: options.cooldown,
    };
    this.telegraphVisual = new Actor({
      radius: shared.telegraphRadius,
      color: shared.telegraphColor,
      collisionType: CollisionType.PreventCollision,
    });
    this.telegraphVisual.graphics.visible = false;
    this.addChild(this.telegraphVisual);
    if (!this.setAnimation("walk")) this.setAnimation("idle");
  }

  protected abstract onTelegraph(): void;
  protected abstract onAttack(): void;

  protected onPhaseUpdate(_progress: number, _elapsedSeconds: number): void {}

  protected shouldAnimateTelegraph(): boolean {
    return true;
  }

  get currentPhase(): EnemyPhase {
    return this.phase;
  }

  protected get player(): Jogador | undefined {
    return this.scene?.actors.find((actor): actor is Jogador => actor instanceof Jogador);
  }

  protected setDurations(durations: EnemyDurations): void {
    this.durations = durations;
  }

  protected addEffect<T extends Actor>(effect: T): T {
    this.effects.add(effect);
    this.scene?.add(effect);
    return effect;
  }

  protected damagePlayer(damage: number, player = this.player): void {
    if (!this.destroyed && this.phase === EnemyPhase.Attack && player) player.levarDano(damage);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    for (const effect of this.effects) {
      if (effect.isKilled()) this.effects.delete(effect);
    }
    if (this.destroyed) return;
    const player = this.player;
    if (this.animation && player) this.animation.flipHorizontal = player.pos.x < this.pos.x;
    if (Estado.pausado || !player) {
      this.vel = Vector.Zero;
      return;
    }
    if (this.phase === EnemyPhase.IdleChase) this.chasePlayer();
    else this.vel = Vector.Zero;

    const elapsedSeconds = elapsed / ENEMY_CONFIG.shared.millisecondsPerSecond;
    this.timer -= elapsedSeconds;
    const progress = 1 - Math.max(this.timer, 0) / this.phaseDuration;
    if (this.phase === EnemyPhase.Telegraph) {
      const { telegraphMinOpacity, telegraphMaxOpacity } = ENEMY_CONFIG.shared;
      this.telegraphVisual.graphics.opacity =
        telegraphMinOpacity + (telegraphMaxOpacity - telegraphMinOpacity) * progress;
    }
    this.onPhaseUpdate(progress, elapsedSeconds);
    if (this.timer > 0) return;

    if (this.phase === EnemyPhase.IdleChase) this.beginTelegraph();
    else if (this.phase === EnemyPhase.Telegraph) this.beginAttack();
    else if (this.phase === EnemyPhase.Attack) this.enterPhase(EnemyPhase.Cooldown, this.durations.cooldown);
    else this.enterPhase(EnemyPhase.IdleChase, ENEMY_CONFIG.shared.idleChase);
  }

  levarDano(quantity: number): void {
    if (this.destroyed) return;
    this.hp -= quantity;
    if (this.hp <= 0) {
      this.beginDeath();
      return;
    }
    const { hitBlinkDuration, hitBlinkInterval, hitBlinkCount } = ENEMY_CONFIG.shared;
    this.actions.blink(hitBlinkDuration, hitBlinkInterval, hitBlinkCount);
  }

  private chasePlayer(): void {
    const player = this.player;
    if (!player) return;
    const direction = player.pos.sub(this.pos);
    this.vel = direction.size > ENEMY_CONFIG.shared.stopDistance
      ? direction.normalize().scale(this.speed)
      : Vector.Zero;
  }

  private beginTelegraph(): void {
    this.phase = EnemyPhase.Telegraph;
    this.onTelegraph();
    this.setTimer(this.durations.telegraph);
    const useSprite = this.shouldAnimateTelegraph();
    const animated = useSprite && this.setAnimation(
      "telegraph",
      this.durations.telegraph * ENEMY_CONFIG.shared.millisecondsPerSecond,
    );
    if (!animated) this.setAnimation("idle");
    this.telegraphVisual.graphics.visible = useSprite && !animated;
    this.telegraphVisual.graphics.opacity = ENEMY_CONFIG.shared.telegraphMinOpacity;
  }

  private beginAttack(): void {
    this.phase = EnemyPhase.Attack;
    this.telegraphVisual.graphics.visible = false;
    this.onAttack();
    this.setTimer(this.durations.attack);
    if (!this.setAnimation(
      "attack",
      this.durations.attack * ENEMY_CONFIG.shared.millisecondsPerSecond,
    )) this.setAnimation("idle");
  }

  private beginDeath(): void {
    this.destroyed = true;
    this.vel = Vector.Zero;
    this.body.collisionType = CollisionType.PreventCollision;
    this.actions.clearActions();
    this.graphics.visible = true;
    this.graphics.opacity = ENEMY_CONFIG.shared.maxProgress;
    for (const child of this.children) child.kill();
    for (const effect of this.effects) {
      effect.body.collisionType = CollisionType.PreventCollision;
      effect.kill();
    }
    this.effects.clear();
    if (!this.setAnimation("die")) {
      this.kill();
      return;
    }
    this.animation?.events.once("end", () => this.kill());
  }

  private enterPhase(phase: EnemyPhase, duration: number): void {
    this.phase = phase;
    this.setTimer(duration);
    if (phase === EnemyPhase.Cooldown) this.setAnimation("idle");
    else if (!this.setAnimation("walk")) this.setAnimation("idle");
  }

  private setAnimation(name: string, durationMs?: number): boolean {
    const animation = getAnimation(this.options.name, name, durationMs);
    if (!animation) return false;
    animation.scale = vec(ENEMY_CONFIG.spriteScale, ENEMY_CONFIG.spriteScale);
    this.animation = animation;
    this.graphics.use(animation);
    return true;
  }

  private setTimer(duration: number): void {
    this.phaseDuration = duration;
    this.timer = duration;
  }
}
