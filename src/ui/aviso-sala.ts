// src/ui/aviso-sala.ts
import { Actor, Color, Text, vec } from "excalibur";
import { Resources } from "../resources";

// Texto rápido no topo da tela ("ARENA", "TESOURO", "SALA LIMPA"...), que some sozinho
export class AvisoSala extends Actor {
  constructor(texto: string, cor = "#ffd400") {
    super({ pos: vec(160, 20), z: 100 });
    this.graphics.use(
      new Text({
        text: texto,
        font: Resources.FontArcade.toFont({ size: 8, color: Color.fromHex(cor), smoothing: false }),
      }),
    );
  }

  override onInitialize(): void {
    this.actions.delay(1200).fade(0, 500).die();
  }
}
