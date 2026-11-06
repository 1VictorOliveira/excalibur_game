import { Color, DisplayMode, Engine, Loader } from "excalibur";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { Configuracoes } from "./scenes/configuracoes";
import { loadables } from "./resources";

// Lê a resolução do localStorage (padrão: 320x180)
const resolucaoSalva = localStorage.getItem("resolucao");
const resolucao = resolucaoSalva ? JSON.parse(resolucaoSalva) : { largura: 320, altura: 180 };

const game = new Engine({
  width: resolucao.largura,
  height: resolucao.altura,
  displayMode: DisplayMode.FitScreen,
  pixelArt: false, // sprites sem borrão ao escalar
  backgroundColor: Color.Black,
  scenes: {
    menu: Menu,
    sala: Sala,
    gameover: GameOver,
    configuracoes: Configuracoes,
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
