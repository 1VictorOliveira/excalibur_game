// src/scenes/configuracoes.ts
import {
  Color, Engine, Scene, Actor, vec,
  Text, FontUnit, Rectangle, Keys, KeyEvent,
} from "excalibur";
import type { Font } from "excalibur";
import { Resources } from "../resources";

const COR_VERDE = Color.fromHex("#33ff66");
const COR_AMARELO = Color.fromHex("#ffd400");
const COR_FUNDO = Color.Black;

const LARGURA = 320;
const ALTURA = 180;

// Resoluções disponíveis
const RESOLUCOES = [
  { nome: "320x180", largura: 320, altura: 180 },
  { nome: "640x360", largura: 640, altura: 360 },
  { nome: "960x540", largura: 960, altura: 540 },
  { nome: "1280x720", largura: 1280, altura: 720 },
];

export class Configuracoes extends Scene {
  private aoApertar = (evt: KeyEvent): void => {
    if (evt.key === Keys.Escape) {
      this.engine.goToScene("menu");
    }
  };

  override onInitialize(_engine: Engine): void {
    this.backgroundColor = COR_FUNDO;
    const cx = LARGURA / 2;

    // Título
    this.criarTexto("CONFIGURACOES", cx + 1, 26, 12, COR_AMARELO);
    this.criarTexto("CONFIGURACOES", cx, 25, 12, COR_VERDE);

    // Subtítulo
    this.criarTexto("RESOLUCAO", cx, 50, 8, COR_VERDE);

    // Botões de resolução
    let y = 70;
    for (const resolucao of RESOLUCOES) {
      this.criarBotaoResolucao(cx, y, resolucao);
      y += 20;
    }

    // Instrução para voltar
    this.criarTexto("ESC - VOLTAR", cx, ALTURA - 15, 6, COR_AMARELO);
  }

  override onActivate(): void {
    this.engine.input.keyboard.on("press", this.aoApertar);
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
    document.body.style.cursor = "default";
  }

  private criarFonte(tamanho: number, cor: Color): Font {
    return Resources.FontArcade.toFont({
      size: tamanho,
      unit: FontUnit.Px,
      color: cor,
      smoothing: false,
    });
  }

  private criarTexto(texto: string, x: number, y: number, tamanho: number, cor: Color): Actor {
    const ator = new Actor({ pos: vec(x, y) });
    ator.graphics.use(new Text({ text: texto, font: this.criarFonte(tamanho, cor) }));
    this.add(ator);
    return ator;
  }

  private criarBotaoResolucao(cx: number, y: number, resolucao: { nome: string; largura: number; altura: number }): void {
    const fundo = new Rectangle({ width: 100, height: 16, color: COR_VERDE });

    const botao = new Actor({ pos: vec(cx, y), width: 100, height: 16 });
    botao.graphics.use(fundo);

    // Rótulo do botão
    const rotulo = new Actor({ pos: vec(0, 0) });
    rotulo.graphics.use(new Text({ text: resolucao.nome, font: this.criarFonte(6, COR_FUNDO) }));
    botao.addChild(rotulo);

    // Cursor ">" ao lado
    const cursor = this.criarTexto(">", cx - 60, y, 6, COR_VERDE);
    cursor.graphics.opacity = 0;

    // Verifica se é a resolução atual (lê do localStorage)
    const resolucaoSalva = localStorage.getItem("resolucao");
    const resolucaoAtual = resolucaoSalva ? JSON.parse(resolucaoSalva) : { largura: 320, altura: 180 };
    const ehAtual = resolucaoAtual.largura === resolucao.largura && resolucaoAtual.altura === resolucao.altura;
    if (ehAtual) {
      this.criarTexto("*", cx + 60, y, 8, COR_AMARELO);
    }

    botao.on("pointerenter", () => {
      fundo.color = COR_AMARELO;
      cursor.graphics.opacity = 1;
      document.body.style.cursor = "pointer";
    });

    botao.on("pointerleave", () => {
      fundo.color = COR_VERDE;
      cursor.graphics.opacity = 0;
      document.body.style.cursor = "default";
    });

    botao.on("pointerdown", () => {
      // Salva a resolução no localStorage
      localStorage.setItem("resolucao", JSON.stringify({
        largura: resolucao.largura,
        altura: resolucao.altura,
      }));
      // Recarrega a página para aplicar a nova resolução
      window.location.reload();
    });

    this.add(botao);
  }
}
