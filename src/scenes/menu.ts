// src/scenes/menu.ts
import { Color, Engine, Scene, Actor, vec, Text, Font, FontUnit, TextAlign } from "excalibur";

export class Menu extends Scene {
  override onInitialize(engine: Engine): void {
    // Fundo da cena
    this.backgroundColor = Color.Black;

    const cx = engine.drawWidth / 2;
    const cy = engine.drawHeight / 2;

    // --- Adicione seu título aqui ---
    // const titulo = new Actor({ pos: vec(cx, 50) });
    // titulo.graphics.use(new Text({ text: "BERZERK", font: ... }));
    // this.add(titulo);

    // --- Botão Jogar ---
    const botao = new Actor({
      name: "botaoJogar",
      pos: vec(cx, cy),
      width: 80,
      height: 24,
      color: Color.Green,
    });

    const texto = new Text({
      text: "JOGAR",
      font: new Font({
        family: "monospace",
        size: 10,
        unit: FontUnit.Px,
        color: Color.White,
        textAlign: TextAlign.Center,
        smoothing: false,
      }),
    });
    botao.graphics.use(texto);

    // Transição para a cena do jogo
    botao.on("pointerdown", () => {
      engine.goToScene("sala");
    });

    this.add(botao);

    // --- Adicione mais elementos visuais aqui ---
    // this.add(...);
  }
}
