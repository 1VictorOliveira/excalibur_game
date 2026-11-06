// src/scenes/configuracoes.ts
import { Color, Engine, Scene, Actor, vec, Text, Font, FontUnit, TextAlign, Rectangle, Keys } from "excalibur";
import { Resources } from "../resources";
import { AudioConfig } from "../audio";

// Cores
const COR_VERDE = Color.fromHex("#33ff66");
const COR_VERDE_ESCURO = Color.fromHex("#1a8033");
const COR_AMARELO = Color.fromHex("#ffd400");
const COR_VERMELHO = Color.fromHex("#ff2d2d");
const COR_FUNDO = Color.Black;
const COR_BRANCO = Color.White;

const LARGURA = 320;
const ALTURA = 180;

// Tipo de ajuste de volume
type TipoVolume = "global" | "musica" | "efeitos";

export class Configuracoes extends Scene {
  private handlersTecla: Array<(evt: { key: Keys }) => void> = [];

  override onInitialize(engine: Engine): void {
    this.backgroundColor = COR_FUNDO;
    const cx = LARGURA / 2;

    // Título
    this.criarTexto("CONFIGURACOES", cx, 15, 12, COR_VERDE);

    // Linha decorativa
    this.criarLinha(20, 28, LARGURA - 40, 2);

    // Controles de volume
    this.criarControleVolume(engine, 45, "VOLUME GLOBAL", "global", AudioConfig.volumeGlobal);
    this.criarControleVolume(engine, 85, "VOLUME MUSICA", "musica", AudioConfig.volumeMusica);
    this.criarControleVolume(engine, 125, "VOLUME EFEITOS", "efeitos", AudioConfig.volumeEfeitos);

    // Botão Voltar
    this.criarBotaoVoltar(engine);

    // Instruções
    this.criarTexto("ESC - VOLTAR", cx, ALTURA - 12, 6, COR_VERMELHO);
  }

  override onActivate(): void {
    const handler = (evt: { key: Keys }) => {
      if (evt.key === Keys.Escape) {
        this.engine.goToScene("menu");
      }
    };
    this.engine.input.keyboard.on("press", handler);
    this.handlersTecla.push(handler);
  }

  override onDeactivate(): void {
    for (const handler of this.handlersTecla) {
      this.engine.input.keyboard.off("press", handler);
    }
    this.handlersTecla = [];
    document.body.style.cursor = "default";
  }

  // Cria um texto na tela
  private criarTexto(texto: string, x: number, y: number, tamanho: number, cor: Color): Actor {
    const ator = new Actor({ pos: vec(x, y) });
    ator.graphics.use(new Text({
      text: texto,
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: tamanho,
        unit: FontUnit.Px,
        color: cor,
        textAlign: TextAlign.Center,
        bold: true,
        smoothing: false,
      }),
    }));
    this.add(ator);
    return ator;
  }

  // Cria uma linha decorativa
  private criarLinha(x: number, y: number, largura: number, altura: number): Actor {
    const linha = new Actor({
      pos: vec(x + largura / 2, y),
      width: largura,
      height: altura,
      color: COR_VERDE_ESCURO,
    });
    this.add(linha);
    return linha;
  }

  // Cria um controle de volume com botões - e +
  private criarControleVolume(
    _engine: Engine,
    y: number,
    titulo: string,
    tipo: TipoVolume,
    valorInicial: number
  ): void {
    const cx = LARGURA / 2;

    // Título do controle
    this.criarTexto(titulo, cx, y, 6, COR_AMARELO);

    // Botão de diminuir
    this.criarBotaoVolume(cx - 100, y + 12, "-", tipo, valorInicial, -10);

    // Texto com valor atual
    const textoValor = this.criarTexto(`${valorInicial}%`, cx, y + 15, 8, COR_VERDE);
    textoValor.name = `valor_${tipo}`;

    // Botão de aumentar
    this.criarBotaoVolume(cx + 100, y + 12, "+", tipo, valorInicial, 10);

    // Barra de progresso visual
    this.criarBarraVolume(cx, y + 25, tipo, valorInicial);
  }

  // Cria um botão de volume (+ ou -)
  private criarBotaoVolume(
    x: number,
    y: number,
    simbolo: string,
    tipo: TipoVolume,
    _valorAtual: number,
    ajuste: number
  ): void {
    const botao = new Actor({
      pos: vec(x, y),
      width: 24,
      height: 16,
      color: COR_VERDE,
    });

    const texto = new Actor({ pos: vec(0, 0) });
    texto.graphics.use(new Text({
      text: simbolo,
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: 10,
        unit: FontUnit.Px,
        color: COR_FUNDO,
        textAlign: TextAlign.Center,
        bold: true,
        smoothing: false,
      }),
    }));
    botao.addChild(texto);

    // Hover
    const corOriginal = COR_VERDE;
    botao.on("pointerenter", () => {
      botao.color = COR_AMARELO;
      document.body.style.cursor = "pointer";
    });
    botao.on("pointerleave", () => {
      botao.color = corOriginal;
      document.body.style.cursor = "default";
    });

    // Click
    botao.on("pointerdown", () => {
      this.ajustarVolume(tipo, ajuste);
    });

    this.add(botao);
  }

  // Cria uma barra visual de volume
  private criarBarraVolume(cx: number, y: number, tipo: TipoVolume, valor: number): void {
    // Fundo da barra
    const fundo = new Actor({
      pos: vec(cx, y),
      width: 120,
      height: 4,
      color: COR_VERDE_ESCURO,
    });
    this.add(fundo);

    // Preenchimento da barra
    const larguraPreenchimento = (valor / 100) * 120;
    const preenchimento = new Actor({
      pos: vec(cx - 60 + larguraPreenchimento / 2, y),
      width: larguraPreenchimento,
      height: 4,
      color: COR_VERDE,
    });
    preenchimento.name = `barra_${tipo}`;
    this.add(preenchimento);
  }

  // Ajusta o volume de um tipo específico
  private ajustarVolume(tipo: TipoVolume, ajuste: number): void {
    let novoValor: number;

    switch (tipo) {
      case "global":
        novoValor = AudioConfig.volumeGlobal + ajuste;
        AudioConfig.setVolumeGlobal(novoValor);
        break;
      case "musica":
        novoValor = AudioConfig.volumeMusica + ajuste;
        AudioConfig.setVolumeMusica(novoValor);
        break;
      case "efeitos":
        novoValor = AudioConfig.volumeEfeitos + ajuste;
        AudioConfig.setVolumeEfeitos(novoValor);
        break;
    }

    // Atualizar valor atual
    const valorAtual = this.getValorAtual(tipo);
    const textoValor = this.actors.find(a => a.name === `valor_${tipo}`) as Actor | undefined;
    if (textoValor) {
      textoValor.graphics.use(new Text({
        text: `${valorAtual}%`,
        font: new Font({
          family: "'Press Start 2P', monospace",
          size: 8,
          unit: FontUnit.Px,
          color: COR_VERDE,
          textAlign: TextAlign.Center,
          bold: true,
          smoothing: false,
        }),
      }));
    }

    // Atualizar barra visual
    this.atualizarBarra(tipo, valorAtual);
  }

  // Obtém o valor atual de um tipo de volume
  private getValorAtual(tipo: TipoVolume): number {
    switch (tipo) {
      case "global": return AudioConfig.volumeGlobal;
      case "musica": return AudioConfig.volumeMusica;
      case "efeitos": return AudioConfig.volumeEfeitos;
    }
  }

  // Atualiza a barra visual de volume
  private atualizarBarra(tipo: TipoVolume, valor: number): void {
    const cx = LARGURA / 2;
    const y = tipo === "global" ? 70 : tipo === "musica" ? 110 : 150;

    // Remover barra antiga
    const barraAntiga = this.actors.find(a => a.name === `barra_${tipo}`);
    if (barraAntiga) {
      barraAntiga.kill();
    }

    // Criar nova barra
    const larguraPreenchimento = (valor / 100) * 120;
    const preenchimento = new Actor({
      pos: vec(cx - 60 + larguraPreenchimento / 2, y),
      width: larguraPreenchimento,
      height: 4,
      color: COR_VERDE,
    });
    preenchimento.name = `barra_${tipo}`;
    this.add(preenchimento);
  }

  // Cria o botão Voltar
  private criarBotaoVoltar(engine: Engine): void {
    const cx = LARGURA / 2;
    const botao = new Actor({
      pos: vec(cx + 100, ALTURA - 20),
      width:50,
      height: 20,
      color: COR_VERDE,
    });

    const texto = new Actor({ pos: vec(0, 0) });
    texto.graphics.use(new Text({
      text: "VOLTAR",
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: 8,
        unit: FontUnit.Px,
        color: COR_FUNDO,
        textAlign: TextAlign.Left,
        bold: true,
        smoothing: false,
      }),
    }));
    botao.addChild(texto);

    // Hover
    botao.on("pointerenter", () => {
      botao.color = COR_AMARELO;
      document.body.style.cursor = "pointer";
    });
    botao.on("pointerleave", () => {
      botao.color = COR_VERDE;
      document.body.style.cursor = "default";
    });

    // Click
    botao.on("pointerdown", () => {
      engine.goToScene("menu");
    });

    this.add(botao);
  }
}
