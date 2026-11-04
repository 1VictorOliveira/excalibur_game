import { Color, DisplayMode, Engine } from "excalibur";
import { Sala } from "./scenes/sala";
import { loader } from "./recursos";

const game = new Engine({
  width: 320, // resolução interna baixa = visual pixel art
  height: 180,
  displayMode: DisplayMode.FitScreen,
  pixelArt: true, // sprites sem borrão ao escalar
  backgroundColor: Color.Black,
  scenes: {
    sala: Sala,
  },
});

game.start("sala", { loader }); // carrega as imagens antes de abrir a sala

// F1 liga/desliga a visualização das caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
