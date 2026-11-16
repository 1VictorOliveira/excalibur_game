// src/ui/carregador.ts
import { DefaultLoader } from "excalibur";

// Tela de carregamento: fundo preto e barra de progresso
export class Carregador extends DefaultLoader {
  override onDraw(ctx: CanvasRenderingContext2D): void {
    const L = ctx.canvas.width;
    const A = ctx.canvas.height;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, L, A);

    const largura = L * 0.4;
    const altura = Math.max(2, Math.round(A * 0.015));
    const x = (L - largura) / 2;
    const y = A / 2;
    ctx.fillStyle = "#1a1a33";
    ctx.fillRect(x, y, largura, altura);
    ctx.fillStyle = "#33ff66";
    ctx.fillRect(x, y, largura * this.progress, altura);
  }
}
