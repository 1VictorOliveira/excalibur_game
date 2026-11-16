import { Color, CoordPlane, DisplayMode, Engine, Font, FontUnit, Label, Scene, WebAudio, vec } from "excalibur";
import { Carregador } from "./ui/carregador";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { Configuracoes } from "./scenes/configuracoes";
import { TesteInimigos } from "./scenes/teste-inimigos";
import { loadables } from "./resources";
import { loadAllSprites } from "../assets/animations";
import { score } from "./score";

// Resolução fixa ideal para pixel art
const LARGURA = 320;
const ALTURA = 180;

const game = new Engine({
  width: LARGURA,
  height: ALTURA,
  displayMode: DisplayMode.FitScreen,
  pixelArt: true,
  antialiasing: false,
  backgroundColor: Color.Black,
  scenes: {
    menu: Menu,
    sala: Sala,
    gameover: GameOver,
    configuracoes: Configuracoes,
    "teste-inimigos": TesteInimigos,
  },
});

// Pré-carrega recursos e inicia no menu.
// Carregador próprio: sem a tela azul e sem o botão "Play game" do Excalibur.
const loader = loadAllSprites(new Carregador({ loadables }));
game.start(loader).then(() => {
  game.goToScene("menu");
});

const scoreHuds = new WeakMap<Scene, Label>();
let activeScoreHud: Label | undefined;
const scoreText = () => `SCORE ${score.value}\nHI-SCORE ${score.highScore}`;
score.subscribe(() => {
  if (activeScoreHud) activeScoreHud.text = scoreText();
});

let previousSceneName: string | undefined;
game.events.on("preframe", () => {
  const currentSceneName = game.currentSceneName;
  activeScoreHud = undefined;
  if (currentSceneName === "sala" || currentSceneName === "teste-inimigos") {
    const scene = game.currentScene;
    let hud = scoreHuds.get(scene);
    if (!hud || hud.isKilled()) {
      hud = new Label({
        text: scoreText(),
        pos: vec(16, 16),
        anchor: vec(0, 0),
        coordPlane: CoordPlane.Screen,
        z: 1000,
        font: new Font({
          family: "monospace",
          size: 12,
          unit: FontUnit.Px,
          color: Color.White,
        }),
      });
      scene.add(hud);
      scoreHuds.set(scene, hud);
    }
    activeScoreHud = hud;
    activeScoreHud.text = scoreText();
  }
  if (currentSceneName === "sala" && previousSceneName !== "sala") score.reset();
  previousSceneName = currentSceneName;
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
  if (e.key === "F2" && import.meta.env.DEV) {
    e.preventDefault();
    void game.goToScene("teste-inimigos");
  }
});
