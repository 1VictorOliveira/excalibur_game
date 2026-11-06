import { Color, DisplayMode, Engine, Loader } from "excalibur";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { loadables } from "./resources";

const game = new Engine({
  width: 320, // resolução interna baixa = visual pixel art
  height: 180,
  displayMode: DisplayMode.FitScreen,
  pixelArt: false, // sprites sem borrão ao escalar
  backgroundColor: Color.Black,
  scenes: {
    menu: Menu,
    sala: Sala,
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
