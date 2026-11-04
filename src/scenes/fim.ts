// src/scenes/fim.ts
import { Engine, Keys, Scene } from "excalibur";
import { montarFundo } from "../cenario/fundo";
import { Texto, TituloRefratado } from "../ui/texto";
import { novaPartida } from "./navegacao";

// Tela de fim de jogo. (Versão simples; o fluxo completo de menu/game over é a #14.)
export class Fim extends Scene {
  override onInitialize(engine: Engine): void {
    const L = engine.drawWidth;
    montarFundo(this, engine);

    this.add(new TituloRefratado("FIM DE JOGO", L / 2, 64, 16));
    this.add(new Texto("A LUZ SE APAGOU...", L / 2, 92, 8, "#a98bff"));
    this.add(new Texto("ENTER - JOGAR DE NOVO", L / 2, 128, 8, "#fff4b0", true));
    this.add(new Texto("ESC - MENU", L / 2, 146, 8, "#8f7fbf"));
  }

  override onPreUpdate(engine: Engine): void {
    const k = engine.input.keyboard;
    if (k.wasPressed(Keys.Enter) || k.wasPressed(Keys.Space)) novaPartida(engine);
    if (k.wasPressed(Keys.Escape)) engine.goToScene("inicio");
  }
}
