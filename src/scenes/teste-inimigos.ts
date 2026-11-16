import { Color, Engine, Keys, Scene, Vector, vec } from "excalibur";
import { Jogador } from "../actors/jogador";
import { BaseEnemy, BaseEnemyOptions } from "../enemies/BaseEnemy";
import { ENEMY_CONFIG } from "../enemies/config";
import { Diabrete } from "../enemies/Diabrete";

class TestEnemy extends BaseEnemy {
  constructor(pos: Vector, options: BaseEnemyOptions) {
    super(pos, options);
  }

  protected onTelegraph(): void {}
  protected onAttack(): void {}
}

export class TesteInimigos extends Scene {
  override onInitialize(): void {
    this.backgroundColor = Color.Black;
    const spawn = ENEMY_CONFIG.testScene.player;
    this.add(new Jogador(vec(spawn.x, spawn.y)));
  }

  override onPreUpdate(engine: Engine): void {
    const keyboard = engine.input.keyboard;
    if (keyboard.wasPressed(Keys.Digit1) || keyboard.wasPressed(Keys.Num1)) {
      const spawn = ENEMY_CONFIG.testScene.diabrete;
      this.add(new Diabrete(vec(spawn.x, spawn.y)));
    }
    if (keyboard.wasPressed(Keys.Digit2) || keyboard.wasPressed(Keys.Num2)) {
      this.spawn(ENEMY_CONFIG.anjoCaido, ENEMY_CONFIG.testScene.anjoCaido);
    }
    if (keyboard.wasPressed(Keys.Digit3) || keyboard.wasPressed(Keys.Num3)) {
      this.spawn(ENEMY_CONFIG.arquidemonio, ENEMY_CONFIG.testScene.arquidemonio);
    }
  }

  private spawn(options: BaseEnemyOptions, position: { readonly x: number; readonly y: number }): void {
    this.add(new TestEnemy(vec(position.x, position.y), options));
  }
}
