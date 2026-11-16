import { Color, Engine, Keys, Scene, vec } from "excalibur";
import { Jogador } from "../actors/jogador";
import { ENEMY_CONFIG } from "../enemies/config";
import { Diabrete } from "../enemies/Diabrete";
import { AnjoCaido } from "../enemies/AnjoCaido";
import { Arquidemonio } from "../enemies/Arquidemonio";

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
      const spawn = ENEMY_CONFIG.testScene.anjoCaido;
      this.add(new AnjoCaido(vec(spawn.x, spawn.y)));
    }
    if (keyboard.wasPressed(Keys.Digit3) || keyboard.wasPressed(Keys.Num3)) {
      const spawn = ENEMY_CONFIG.testScene.arquidemonio;
      this.add(new Arquidemonio(vec(spawn.x, spawn.y)));
    }
  }
}
