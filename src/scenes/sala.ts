import { Color, Engine, Scene, vec } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Parede } from "../actors/parede";
import { Robo } from "../actors/robos";

export class Sala extends Scene {
  override onInitialize(engine: Engine): void {
    this.backgroundColor = Color.fromHex("#0d0d14");

    const L = engine.drawWidth; // 320
    const A = engine.drawHeight; // 180
    const e = 6; // espessura da parede

    // Bordas da sala (as portas entram na issue #12)
    this.add(new Parede(0, 0, L, e)); // cima
    this.add(new Parede(0, A - e, L, e)); // baixo
    this.add(new Parede(0, 0, e, A)); // esquerda
    this.add(new Parede(L - e, 0, e, A)); // direita

    this.add(new Jogador(vec(40, A / 2)));

    // Robôs inimigos
    this.add(new Robo(vec(220, 50)));
    this.add(new Robo(vec(260, 130)));
  }
}
