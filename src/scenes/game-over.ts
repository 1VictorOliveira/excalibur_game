// src/scenes/game-over.ts
import { Color, Engine, Scene, Actor, vec, Text, Font, FontUnit, TextAlign, Keys } from "excalibur";
import { Estado } from "../estado";

export class GameOver extends Scene {
  private aoApertar = (evt: { key: Keys }): void => {
    if (evt.key === Keys.Enter) {
      this.reiniciar();
    }
  };

  override onInitialize(engine: Engine): void {
    this.backgroundColor = Color.Black;
    const cx = engine.drawWidth / 2;
    const cy = engine.drawHeight / 2;

    // Texto "GAME OVER" - centralizado
    const titulo = new Actor({ pos: vec(cx + 60, cy - 40) });
    const textoTitulo = new Text({
      text: "GAME OVER",
      font: new Font({
        family: "monospace",
        size: 24,
        unit: FontUnit.Px,
        color: Color.Red,
        textAlign: TextAlign.Center,
        bold: true,
        smoothing: false,
      }),
      maxWidth: engine.drawWidth,
    });
    titulo.graphics.use(textoTitulo);
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

    // Texto do botão - separado do fundo, com maxWidth igual à largura do botão
    const textoBotao = new Actor({
      pos: vec(cx + 40, cy + 20),
    });
    const texto = new Text({
      text: "TENTAR DE NOVO",
      font: new Font({
        family: "monospace",
        size: 10,
        unit: FontUnit.Px,
        color: Color.Black,
        textAlign: TextAlign.Center,
        bold: true,
        smoothing: false,
      }),
      maxWidth: 120, // mesma largura do fundo do botão
    });
    textoBotao.graphics.use(texto);
    textoBotao.z = 1; // garante que o texto fique por cima do fundo
    this.add(textoBotao);

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
