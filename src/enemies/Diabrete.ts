import { Actor, Collider, CollisionType, Vector, vec } from "excalibur";
import { Bala } from "../actors/bala";
import { Parede } from "../actors/parede";
import { Grupos } from "../grupos";
import { BaseEnemy, EnemyPhase } from "./BaseEnemy";
import { ENEMY_CONFIG } from "./config";

export class Diabrete extends BaseEnemy {
  private readonly leftHand: Actor;
  private readonly rightHand: Actor;
  private patrolDirection = vec(1, 0);
  private patrolTimer = 0;
  private hitWall = false;

  constructor(pos: Vector) {
    super(pos, ENEMY_CONFIG.diabrete);
    const config = ENEMY_CONFIG.diabrete;
    this.leftHand = this.createHand(vec(-config.handOffset, 0));
    this.rightHand = this.createHand(vec(config.handOffset, 0));
    this.choosePatrolDirection();
  }

  protected override onChase(elapsedSeconds: number): boolean {
    if (this.hasLineOfSight()) {
      this.chasePlayer();
      return true;
    }
    this.patrol(elapsedSeconds);
    return false;
  }

  override onCollisionStart(_self: Collider, other: Collider): void {
    if (other.owner instanceof Parede) this.hitWall = true;
  }

  protected onTelegraph(): void {
    this.leftHand.graphics.visible = true;
    this.rightHand.graphics.visible = true;
  }

  protected onAttack(): void {
    this.leftHand.graphics.visible = false;
    this.rightHand.graphics.visible = false;
    if (!this.player) return;
    const config = ENEMY_CONFIG.diabrete;
    const direction = this.player.pos.sub(this.pos).normalize();
    const spawn = this.pos.add(direction.scale(config.projectileSpawnOffset));
    const projectile = new Bala(
      spawn,
      direction,
      Grupos.tiroInimigo,
      config.color,
      config.projectileSpeed,
      config.projectileLifetime * ENEMY_CONFIG.shared.millisecondsPerSecond,
      config.projectileRadius,
    );
    projectile.dano = config.damage;
    this.addEffect(projectile);
  }

  protected override onPhaseUpdate(progress: number): void {
    if (this.currentPhase !== EnemyPhase.Telegraph) return;
    const { telegraphMinOpacity, telegraphMaxOpacity } = ENEMY_CONFIG.shared;
    const opacity = telegraphMinOpacity + (telegraphMaxOpacity - telegraphMinOpacity) * progress;
    this.leftHand.graphics.opacity = opacity;
    this.rightHand.graphics.opacity = opacity;
  }

  private patrol(elapsedSeconds: number): void {
    this.patrolTimer -= elapsedSeconds;
    if (this.patrolTimer <= 0 || this.hitWall) this.choosePatrolDirection();
    this.vel = this.patrolDirection.scale(this.speed);
  }

  private choosePatrolDirection(): void {
    const directions = [vec(1, 0), vec(-1, 0), vec(0, 1), vec(0, -1)];
    const options = directions.filter(
      (direction) => direction.x !== this.patrolDirection.x || direction.y !== this.patrolDirection.y,
    );
    this.patrolDirection = options[Math.floor(Math.random() * options.length)];
    this.patrolTimer = ENEMY_CONFIG.diabrete.patrolTurnInterval;
    this.hitWall = false;
  }

  private createHand(pos: Vector): Actor {
    const config = ENEMY_CONFIG.diabrete;
    const hand = new Actor({
      pos,
      radius: config.handRadius,
      color: config.color,
      collisionType: CollisionType.PreventCollision,
    });
    hand.graphics.visible = false;
    this.addChild(hand);
    return hand;
  }
}
