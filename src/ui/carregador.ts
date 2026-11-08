// src/ui/carregador.ts
import { DefaultLoader } from "excalibur";

// Tela de carregamento própria: fundo preto e uma barra simples.
// Substitui a tela azul do Excalibur e o botão "Play game".
export class Carregador extends DefaultLoader {
  override onDraw(ctx: CanvasRenderingContext2D): void {
    const L = ctx.canvas.width;
    const A = ctx.canvas.height;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, L, A);

    // Barra de progresso no meio da tela
    const largura = L * 0.4;
    const altura = Math.max(2, Math.round(A * 0.015));
    const x = (L - largura) / 2;
    const y = A / 2;
    ctx.fillStyle = "#1a1a33";
    ctx.fillRect(x, y, largura, altura);
    ctx.fillStyle = "#33ff66"; // verde do menu
    ctx.fillRect(x, y, largura * this.progress, altura);
  }
}
