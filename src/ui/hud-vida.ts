// src/ui/hud-vida.ts
import { Actor, Color, CollisionType, GraphicsGroup, Rectangle, vec } from "excalibur";
import { Jogador } from "../actors/jogador";

// Vida do jogador no canto superior esquerdo: uma cruzinha de luz por ponto de vida.
// Sem isso o jogador não sabia quanta vida tinha e a morte parecia "do nada".
// (Versão mínima; pontuação e HUD completo continuam na issue #18.)
export class HudVida extends Actor {
  private ultimoHp = -1;

  constructor(private jogador: Jogador) {
    super({ pos: vec(10, 10), anchor: vec(0, 0), z: 100, collisionType: CollisionType.PreventCollision });
  }

  override onPreUpdate(): void {
    const hp = Math.max(0, this.jogador.estaMorto ? 0 : this.jogador.hp);
    if (hp === this.ultimoHp) return; // só redesenha quando muda
    this.ultimoHp = hp;

    const membros = [];
    for (let i = 0; i < this.jogador.hpMax; i++) {
      const cheio = i < hp;
      const cor = Color.fromHex(cheio ? "#fff4b0" : "#3a2f5c");
      const x = i * 8;
      membros.push({ graphic: new Rectangle({ width: 5, height: 1, color: cor }), offset: vec(x, 2) });
      membros.push({ graphic: new Rectangle({ width: 1, height: 5, color: cor }), offset: vec(x + 2, 0) });
      if (cheio) {
        membros.push({ graphic: new Rectangle({ width: 1, height: 1, color: Color.White }), offset: vec(x + 2, 2) });
      }
    }
    this.graphics.use(new GraphicsGroup({ members: membros }));
  }
}
