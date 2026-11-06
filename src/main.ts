import { Color, DisplayMode, Engine, Loader } from "excalibur";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { loadables } from "./resources";

// Resolução fixa ideal para pixel art
const LARGURA = 320;
const ALTURA = 180;

const game = new Engine({
  width: LARGURA,
  height: ALTURA,
  displayMode: DisplayMode.FitScreen,
  pixelArt: false,
  backgroundColor: Color.Black,
  scenes: {
    menu: Menu,
    sala: Sala,
    gameover: GameOver,
  },
});

// Pré-carrega recursos e inicia no menu
const loader = new Loader(loadables);
game.start(loader).then(() => {
  game.goToScene("menu");
});

// F1 liga/desliga a visualização das caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
