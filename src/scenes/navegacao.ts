// src/scenes/navegacao.ts
import { Engine } from "excalibur";
import { Sala } from "./sala";

// Começa uma partida do zero: descarta a sala antiga e cria uma nova.
// (Sem isso, voltar para "sala" reabriria a mesma sala, com o jogador já morto.)
export function novaPartida(engine: Engine): void {
  engine.removeScene("sala");
  engine.addScene("sala", Sala);
  engine.goToScene("sala");
}
