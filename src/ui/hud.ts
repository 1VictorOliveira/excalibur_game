// src/ui/hud.ts
import { Actor, Color, Engine, GraphicsGroup, Rectangle, vec } from "excalibur";
import { Jogador } from "../actors/jogador";

// Mostra a vida do jogador como pequenas luzes no canto superior esquerdo.
// (Versão mínima para o jogador entender quando vai morrer; o HUD completo é a #18.)
export class HudVidas extends Actor {
  private ultimoHp = -1;

  constructor(private jogador: Jogador) {
    super({ pos: vec(10, 10), anchor: vec(0, 0), z: 100 });
  }

  override onPreUpdate(_engine: Engine): void {
    const hp = Math.max(0, this.jogador.hp);
    if (hp === this.ultimoHp) return; // só redesenha quando muda
    this.ultimoHp = hp;

    const membros = [];
    for (let i = 0; i < this.jogador.hpMax; i++) {
      const cheio = i < hp;
      const cor = Color.fromHex(cheio ? "#fff4b0" : "#3a2f5c");
      const x = i * 8;
      // cruzinha 5x5 por vida
      membros.push({ graphic: new Rectangle({ width: 5, height: 1, color: cor }), offset: vec(x, 2) });
      membros.push({ graphic: new Rectangle({ width: 1, height: 5, color: cor }), offset: vec(x + 2, 0) });
      if (cheio) {
        membros.push({ graphic: new Rectangle({ width: 1, height: 1, color: Color.White }), offset: vec(x + 2, 2) });
      }
    }
    this.graphics.use(new GraphicsGroup({ members: membros }));
  }
}
