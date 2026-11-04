// src/scenes/sala.ts
import { Color, Engine, Scene } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Robo } from "../actors/robos";
import { COLUNAS, LINHAS, montarLabirinto } from "../salas/labirinto";

export class Sala extends Scene {
  override onInitialize(engine: Engine): void {
    this.backgroundColor = Color.fromHex("#0d0d14");

    // Bordas + labirinto sorteado (issue #11)
    const labirinto = montarLabirinto(this, engine);

    // Jogador começa na célula do meio da coluna da esquerda, ao lado da porta
    this.add(new Jogador(labirinto.centroDaCelula(0, 1)));

    // Robôs nascem no centro de células sorteadas, longe do jogador
    // (nunca dentro de parede, senão se autodestroem na hora)
    const livres: [number, number][] = [];
    for (let c = 2; c < COLUNAS; c++) for (let l = 0; l < LINHAS; l++) livres.push([c, l]);
    livres.sort(() => Math.random() - 0.5);

    const quantidadeRobos = 3;
    for (const [c, l] of livres.slice(0, quantidadeRobos)) {
      this.add(new Robo(labirinto.centroDaCelula(c, l)));
    }
  }
}
