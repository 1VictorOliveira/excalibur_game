import { Color, DisplayMode, Engine } from "excalibur";
import { Sala } from "./scenes/sala";
import { Inicio } from "./scenes/inicio";
import { Fim } from "./scenes/fim";
import { loader } from "./recursos";

const game = new Engine({
  width: 320, // resolução interna baixa = visual pixel art
  height: 180,
  displayMode: DisplayMode.FitScreen,
  pixelArt: true, // sprites sem borrão ao escalar
  backgroundColor: Color.Black,
  scenes: {
    inicio: Inicio, // tela inicial (home)
    sala: Sala, // o jogo em si
    fim: Fim, // fim de jogo, com reinício
  },
});

game.start("inicio", { loader }); // carrega imagens e fonte, depois abre a home

// F1 liga/desliga a visualização das caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
