import { Actor, Circle, CollisionType, Color, Vector, vec } from "excalibur";
import { BaseEnemy, EnemyPhase } from "./BaseEnemy";
import { ENEMY_CONFIG } from "./config";

export class AnjoCaido extends BaseEnemy {
  private target = Vector.Zero;
  private runes?: Actor;
  private fill?: Actor;
  private spear?: Actor;

  constructor(pos: Vector) {
    super(pos, ENEMY_CONFIG.anjoCaido);
  }

  protected onTelegraph(): void {
    if (!this.player) return;
    this.clearVisuals();
    const config = ENEMY_CONFIG.anjoCaido;
    this.target = this.player.pos.add(this.player.vel.scale(config.prediction));
    this.runes = new Actor({ pos: this.target, collisionType: CollisionType.PreventCollision });
    this.runes.graphics.use(new Circle({
      radius: config.areaRadius,
      color: Color.Transparent,
      strokeColor: config.color,
      lineWidth: config.runeLineWidth,
    }));
    this.fill = new Actor({
      radius: config.areaRadius,
      color: config.color,
      collisionType: CollisionType.PreventCollision,
    });
    this.fill.graphics.opacity = config.runeFillOpacity;
    this.fill.scale = Vector.Zero;
    this.runes.addChild(this.fill);
    for (let i = 0; i < config.runeCount; i++) {
      const angle = i / config.runeCount * config.fullCircleRadians;
      this.runes.addChild(new Actor({
        pos: vec(Math.cos(angle) * config.areaRadius, Math.sin(angle) * config.areaRadius),
        width: config.runeSize,
        height: config.runeSize,
        color: config.color,
        collisionType: CollisionType.PreventCollision,
      }));
    }
    this.addEffect(this.runes);
  }

  protected onAttack(): void {
    const config = ENEMY_CONFIG.anjoCaido;
    if (this.fill) this.fill.scale = Vector.One;
    this.spear = new Actor({
      pos: this.target.sub(vec(0, config.spearDropHeight)),
      width: config.spearWidth,
      height: config.spearLength,
      color: config.spearColor,
      collisionType: CollisionType.PreventCollision,
    });
    this.addEffect(this.spear);
    if (this.player && this.player.pos.distance(this.target) <= config.areaRadius) {
      this.damagePlayer(config.damage);
    }
  }

  protected override onPhaseUpdate(progress: number): void {
    const config = ENEMY_CONFIG.anjoCaido;
    if (this.currentPhase === EnemyPhase.Telegraph && this.runes && this.fill) {
      this.runes.rotation = progress * config.fullCircleRadians;
      this.fill.scale = vec(progress, progress);
    }
    if (this.currentPhase === EnemyPhase.Attack && this.spear) {
      this.spear.pos = this.target.sub(vec(0, config.spearDropHeight * (1 - progress)));
      if (progress >= 1) this.clearVisuals();
    }
  }

  private clearVisuals(): void {
    this.runes?.kill();
    this.spear?.kill();
    this.runes = undefined;
    this.fill = undefined;
    this.spear = undefined;
  }
}
