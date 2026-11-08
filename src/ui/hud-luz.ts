// src/ui/hud-luz.ts
import { Actor, Color, GraphicsGroup, Rectangle, Text, vec } from "excalibur";
import { Resources } from "../resources";
import { Jogador } from "../actors/jogador";

// Mostra a habilidade de luz escolhida e, no Foco, a barra de carga.
export class HudLuz extends Actor {
  private ultimoNome = "";
  private barra = new Rectangle({ width: 1, height: 2, color: Color.White });

  constructor(private jogador: Jogador) {
    super({ pos: vec(10, 160), anchor: vec(0, 0), z: 100 });
  }

  override onPreUpdate(): void {
    const habilidade = this.jogador.habilidadeAtual;

    if (habilidade.nome !== this.ultimoNome) {
      this.ultimoNome = habilidade.nome;
      this.barra.color = habilidade.cor;
      const texto = new Text({
        text: `${this.jogador.indiceHabilidade + 1} ${habilidade.nome}`,
        font: Resources.FontArcade.toFont({ size: 8, color: habilidade.cor, smoothing: false }),
      });
      this.graphics.use(
        new GraphicsGroup({
          members: [
            { graphic: texto, offset: vec(0, 0) },
            { graphic: this.barra, offset: vec(0, 10) },
          ],
        }),
      );
    }

    // Barra de carga do Foco (some nas outras habilidades)
    const carga = habilidade.carga();
    this.barra.width = Math.max(1, Math.round(60 * carga));
    this.barra.opacity = carga > 0 ? 1 : 0;
  }
}
