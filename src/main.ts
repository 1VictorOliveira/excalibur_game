import { Color, DisplayMode, Engine } from "excalibur";
import { Carregador } from "./ui/carregador";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { Configuracoes } from "./scenes/configuracoes";
import { loadables } from "./resources";

// Resolução fixa ideal para pixel art
const LARGURA = 320;
const ALTURA = 180;

const game = new Engine({
  width: LARGURA,
  height: ALTURA,
  displayMode: DisplayMode.FitScreen,
  // Nitidez: a tela é 320x180 e o navegador amplia até caber no monitor.
  // Com antialiasing ligado (padrão), essa ampliação é suavizada e tudo fica borrado.
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

// Pré-carrega recursos e inicia no menu.
// Carregador próprio: sem a tela azul e sem o botão "Play game" do Excalibur.
const loader = new Carregador({ loadables });
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
