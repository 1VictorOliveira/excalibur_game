import { Color, CoordPlane, DisplayMode, Engine, Font, FontUnit, Label, Scene, vec } from "excalibur";
import { Carregador } from "./ui/carregador";
import { Sala } from "./scenes/sala";
import { Menu } from "./scenes/menu";
import { GameOver } from "./scenes/game-over";
import { Configuracoes } from "./scenes/configuracoes";
import { TesteInimigos } from "./scenes/teste-inimigos";
import { loadables } from "./resources";
import { loadAllSprites } from "../assets/animations";
import { score } from "./score";
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
    "teste-inimigos": TesteInimigos,
  },
});

// Carrega os recursos e inicia na sala principal; ?test abre a sala de teste.
const loader = loadAllSprites(new Carregador({ loadables }));
const cenaInicial = new URLSearchParams(window.location.search).has("test") ? "teste-inimigos" : "sala";
game.start(loader).then(() => {
  game.goToScene(cenaInicial);
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

// F1: mostra as caixas de colisão
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    game.toggleDebug();
  }
});
