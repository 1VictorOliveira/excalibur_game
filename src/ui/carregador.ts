// src/ui/carregador.ts
import { DefaultLoader } from "excalibur";

// Tela de carregamento própria (substitui a tela azul do Excalibur)
export class Carregador extends DefaultLoader {
  override onDraw(ctx: CanvasRenderingContext2D): void {
    const L = ctx.canvas.width;
    const A = ctx.canvas.height;

    ctx.fillStyle = "#05050c";
    ctx.fillRect(0, 0, L, A);

    // Título
    ctx.fillStyle = "#fff4b0";
    ctx.font = `bold ${Math.round(A * 0.07)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("REFRACT", L / 2, A * 0.45);

    // Barra de progresso fina, violeta
    const largura = L * 0.3;
    const altura = Math.max(2, Math.round(A * 0.008));
    const x = (L - largura) / 2;
    const y = A * 0.56;
    ctx.fillStyle = "#1c1533";
    ctx.fillRect(x, y, largura, altura);
    ctx.fillStyle = "#a98bff";
    ctx.fillRect(x, y, largura * this.progress, altura);
  }
}
