// src/scenes/inicio.ts
import { Actor, Animation, Color, EmitterType, Engine, Keys, ParticleEmitter, Scene, SpriteSheet, vec } from "excalibur";
import { montarFundo } from "../cenario/fundo";
import { Recursos } from "../recursos";
import { Texto } from "../ui/texto";
import { LogoRefratado } from "../ui/logo";
import { novaPartida } from "./navegacao";

// Tela inicial (home)
export class Inicio extends Scene {
  private tempo = 0;
  private luz!: Actor;

  override onInitialize(engine: Engine): void {
    const L = engine.drawWidth;
    montarFundo(this, engine);

    this.add(new LogoRefratado(L / 2, 50));

    // A luz flutuando no meio da tela, soltando brilho
    this.luz = new Actor({ pos: vec(L / 2, 100), z: 40 });
    const folha = SpriteSheet.fromImageSource({
      image: Recursos.Luz,
      grid: { rows: 2, columns: 4, spriteWidth: 24, spriteHeight: 24 },
    });
    this.luz.graphics.use(Animation.fromSpriteSheet(folha, [0, 1, 2, 3], 150));
    const brilho = new ParticleEmitter({
      emitterType: EmitterType.Circle,
      radius: 4,
      emitRate: 20,
      isEmitting: true,
      particle: {
        life: 900,
        minSpeed: 4,
        maxSpeed: 14,
        minSize: 1,
        maxSize: 2,
        beginColor: Color.fromHex("#fff4b0"),
        endColor: Color.fromHex("#8c61d4"),
        fade: true,
      },
    });
    brilho.z = -1;
    this.luz.addChild(brilho);
    this.add(this.luz);

    this.add(new Texto("PRESSIONE ENTER", L / 2, 140, 8, "#fff4b0", true));
    this.add(new Texto("WASD MOVER - SETAS ATIRAR", L / 2, 164, 8, "#8f7fbf"));
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;
    this.luz.pos.y = 100 + Math.sin(this.tempo * 2) * 3;

    const k = engine.input.keyboard;
    if (k.wasPressed(Keys.Enter) || k.wasPressed(Keys.Space)) {
      novaPartida(engine);
    }
  }
}
