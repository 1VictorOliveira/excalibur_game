// src/scenes/game-over.ts
import { Color, Engine, Scene, Actor, vec, Text, Keys } from "excalibur";
import { Estado } from "../estado";
import { fontePixel } from "../ui/fonte";

export class GameOver extends Scene {
  private aoApertar = (evt: { key: Keys }): void => {
    if (evt.key === Keys.Enter) {
      this.reiniciar();
    }
    if (evt.key === Keys.Escape) {
      this.engine.goToScene("menu");
    }
  };

  override onInitialize(engine: Engine): void {
    this.backgroundColor = Color.Black;
    const cx = engine.drawWidth / 2;
    const cy = engine.drawHeight / 2;

    // Texto "GAME OVER" - centralizado (a âncora do Actor já centraliza, sem textAlign)
    const titulo = new Actor({ pos: vec(cx, cy - 40) });
    titulo.graphics.use(new Text({ text: "GAME OVER", font: fontePixel(24, Color.Red) }));
    this.add(titulo);

    // Botão "TENTAR DE NOVO" - fundo verde
    const fundoBotao = new Actor({
      name: "fundoBotao",
      pos: vec(cx, cy + 20),
      width: 120,
      height: 24,
      color: Color.fromHex("#33ff66"),
    });
    this.add(fundoBotao);

    // Texto do botão - separado do fundo, centralizado sobre ele
    const textoBotao = new Actor({ pos: vec(cx, cy + 20) });
    textoBotao.graphics.use(new Text({ text: "TENTAR DE NOVO", font: fontePixel(8, Color.Black) }));
    textoBotao.z = 1; // garante que o texto fique por cima do fundo
    this.add(textoBotao);

    // Atalhos
    const atalhos = new Actor({ pos: vec(cx, cy + 56) });
    atalhos.graphics.use(new Text({ text: "ENTER JOGAR  ESC MENU", font: fontePixel(8, Color.fromHex("#33ff66")) }));
    this.add(atalhos);

    // Click handler no fundo do botão
    fundoBotao.on("pointerdown", () => {
      this.reiniciar();
    });
  }

  override onActivate(): void {
    this.engine.input.keyboard.on("press", this.aoApertar);
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
  }

  private reiniciar(): void {
    // Reseta estado do jogador
    Estado.hp = Estado.hpMax;
    Estado.coordX = 0;
    Estado.coordY = 0;
    Estado.portaEntrada = null;
    
    this.engine.goToScene("sala");
  }
}
