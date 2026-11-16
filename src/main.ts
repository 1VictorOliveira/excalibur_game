import { Color, DisplayMode, Engine } from "excalibur";
import { Carregador } from "./ui/carregador";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { Configuracoes } from "./scenes/configuracoes";
import { loadables } from "./resources";
import { ALTURA, LARGURA } from "./config";

const game = new Engine({
  width: LARGURA,
  height: ALTURA,
  displayMode: DisplayMode.FitScreen,
  // Pixel art nítido ao ampliar
  pixelArt: true,
  antialiasing: false,
  backgroundColor: Color.Black,
  scenes: {
    menu: Menu,
    sala: Sala,
    gameover: GameOver,
    configuracoes: Configuracoes,
  },
});

// Carrega os recursos e abre o menu
const loader = new Carregador({ loadables });
game.start(loader).then(() => {
  game.goToScene("menu");
});

// F1: mostra as caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
