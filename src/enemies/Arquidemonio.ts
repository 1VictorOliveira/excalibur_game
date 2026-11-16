import { Actor, Circle, CollisionType, Vector, vec } from "excalibur";
import { BaseEnemy, EnemyPhase } from "./BaseEnemy";
import { ENEMY_CONFIG } from "./config";
export class Arquidemonio extends BaseEnemy {
  private near = true;
  private aim = Vector.Right;
  private ring?: Actor;
  private beam?: Actor;
  private readonly warnings: Actor[];
  constructor(pos: Vector) {
    super(pos, ENEMY_CONFIG.arquidemonio);
    const config = ENEMY_CONFIG.arquidemonio.near;
    this.warnings = config.warningParts.map((part) => {
      const visual = new Actor({ ...part, pos: vec(part.x, part.y), color: config.warningColor, collisionType: CollisionType.PreventCollision });
      visual.graphics.visible = false;
      this.addChild(visual);
      return visual;
    });
  }
  protected onTelegraph(): void {
    this.clearVisuals();
    if (!this.player) return;
    const config = ENEMY_CONFIG.arquidemonio;
    this.near = this.player.pos.distance(this.pos) <= config.cutoffDistance;
    this.setDurations(this.near ? config.near : config.far);
    if (this.near) {
      for (const warning of this.warnings) warning.graphics.visible = true;
      return;
    }
    this.beam = new Actor({ width: config.far.beamLength, height: config.far.lineWidth,
      color: config.far.color, collisionType: CollisionType.PreventCollision });
    this.scene?.add(this.beam);
    this.updateAim();
  }
  protected onAttack(): void {
    const config = ENEMY_CONFIG.arquidemonio;
    if (this.near) {
      this.ring = new Actor({ pos: this.pos.clone(), collisionType: CollisionType.PreventCollision });
      this.ring.graphics.use(new Circle({ radius: config.near.ringEndRadius, color: config.near.fillColor,
        strokeColor: config.near.warningColor, lineWidth: config.near.ringThickness }));
      this.ring.scale = Vector.Zero;
      this.scene?.add(this.ring);
      return;
    }
    if (!this.beam || !this.player) return;
    this.beam.scale = vec(1, config.far.beamWidth / config.far.lineWidth);
    const relative = this.player.pos.sub(this.pos);
    const projection = relative.dot(this.aim);
    const lateralDistance = relative.sub(this.aim.scale(projection)).size;
    if (projection >= config.far.beamStart && projection <= config.far.beamLength &&
      lateralDistance <= config.far.beamWidth * ENEMY_CONFIG.shared.half) this.damagePlayer(config.far.damage);
  }
  protected override onPhaseUpdate(progress: number): void {
    if (this.currentPhase === EnemyPhase.Telegraph) {
      this.updateAim();
      const { telegraphMinOpacity, telegraphMaxOpacity } = ENEMY_CONFIG.shared;
      const opacity = telegraphMinOpacity + (telegraphMaxOpacity - telegraphMinOpacity) * progress;
      for (const warning of this.warnings) warning.graphics.opacity = opacity;
    }
    if (this.currentPhase !== EnemyPhase.Attack) return;
    const config = ENEMY_CONFIG.arquidemonio.near;
    const attackProgress = Math.min(progress, ENEMY_CONFIG.shared.maxProgress);
    if (this.near && this.ring && this.player) {
      const radius = config.ringStartRadius + (config.ringEndRadius - config.ringStartRadius) * attackProgress;
      this.ring.scale = Vector.One.scale(radius / config.ringEndRadius);
      const edgeDistance = Math.abs(this.player.pos.distance(this.pos) - radius);
      if (edgeDistance <= config.ringThickness * attackProgress * ENEMY_CONFIG.shared.half) this.damagePlayer(config.damage);
    }
    if (progress >= ENEMY_CONFIG.shared.maxProgress) this.clearVisuals();
  }
  private updateAim(): void {
    if (this.near || !this.player || !this.beam) return;
    const length = ENEMY_CONFIG.arquidemonio.far.beamLength;
    this.aim = this.player.pos.sub(this.pos).normalize();
    this.beam.pos = this.pos.add(this.aim.scale(length * ENEMY_CONFIG.shared.half));
    this.beam.rotation = this.aim.toAngle();
  }
  private clearVisuals(): void {
    for (const warning of this.warnings) warning.graphics.visible = false;
    this.ring?.kill(); this.beam?.kill();
    this.ring = this.beam = undefined;
  }
}
