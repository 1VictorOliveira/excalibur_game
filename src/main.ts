import { Color, DisplayMode, Engine, WebAudio } from "excalibur";
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
  pixelArt: false,
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

// O botão "Play game" existia para liberar o áudio (o navegador só deixa tocar som
// depois de um clique ou tecla). Sem ele, liberamos no primeiro clique/tecla do jogador.
const liberarAudio = () => {
  void WebAudio.unlock();
  window.removeEventListener("pointerdown", liberarAudio);
  window.removeEventListener("keydown", liberarAudio);
};
window.addEventListener("pointerdown", liberarAudio);
window.addEventListener("keydown", liberarAudio);

// F1 liga/desliga a visualização das caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
