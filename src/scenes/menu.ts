// src/scenes/menu.ts
import {
  Color, Engine, Scene, Actor, vec,
  Text, FontUnit, Rectangle, Keys, KeyEvent,
} from "excalibur";
import type { Font } from "excalibur";
import { Resources } from "../resources";

// Cores do design arcade retrô
const COR_VERMELHO = Color.fromHex("#ff2d2d");
const COR_AMARELO = Color.fromHex("#ffd400");
const COR_AZUL = Color.fromHex("#2a4bff");
const COR_VERDE = Color.fromHex("#33ff66");
const COR_VERDE_ESCURO = Color.fromHex("#1a8033");
const COR_FUNDO = Color.Black;

// Precisam ser IGUAIS a width/height do Engine no main.ts
const LARGURA = 320;
const ALTURA = 180;

export class Menu extends Scene {
  // Handler do Enter como propriedade, para poder registrar e remover o MESMO objeto
  private aoApertar = (evt: KeyEvent): void => {
    if (evt.key === Keys.Enter) {
      this.engine.goToScene("sala");
    }
  };

  override onInitialize(_engine: Engine): void {
    this.backgroundColor = COR_FUNDO;
    const cx = LARGURA / 2;

    // Título: a sombra amarela é adicionada primeiro para ficar atrás
    this.criarTexto("BERZERK", cx + 2, 27, 16, COR_AMARELO);
    this.criarTexto("BERZERK", cx, 25, 16, COR_VERMELHO);

    this.criarMoldura();
    this.criarBotao(cx, 100, "JOGAR", () => this.engine.goToScene("sala"));
    this.criarBotao(cx, 125, "CONFIG", () => this.engine.goToScene("configuracoes"));
    this.criarInsertCoin(cx);

    // Rodapé (sem glifos especiais, que a fonte pode não ter)
    this.criarTexto("(C) 1980 PROTOTIPO", cx, ALTURA - 12, 8, COR_VERDE_ESCURO);
  }

  // Enter: registra ao entrar na cena e remove ao sair (funciona ao voltar ao menu)
  override onActivate(): void {
    this.engine.input.keyboard.on("press", this.aoApertar);
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
    document.body.style.cursor = "default";
  }

  // Fonte pixelada: use tamanhos múltiplos de 8 (8, 16, 24...), sem bold e sem textAlign
  private criarFonte(tamanho: number, cor: Color): Font {
    return Resources.FontArcade.toFont({
      size: tamanho,
      unit: FontUnit.Px,
      color: cor,
      smoothing: false,
    });
  }

  // Cria um ator só com texto e já adiciona na cena
  private criarTexto(texto: string, x: number, y: number, tamanho: number, cor: Color): Actor {
    const ator = new Actor({ pos: vec(x, y) });
    ator.graphics.use(new Text({ text: texto, font: this.criarFonte(tamanho, cor) }));
    this.add(ator);
    return ator;
  }

  // Parede com âncora no canto superior esquerdo, evitando posições com meio pixel
  private parede(x: number, y: number, w: number, h: number): void {
    const p = new Actor({ pos: vec(x, y), anchor: vec(0, 0), width: w, height: h });
    p.graphics.use(new Rectangle({ width: w, height: h, color: COR_AZUL }));
    this.add(p);
  }

  // Moldura azul com aberturas de 30px no meio de cada lado
  private criarMoldura(): void {
    const e = 3;                       // espessura
    const porta = 30;                  // largura da abertura
    const w = (LARGURA - porta) / 2;   // 145
    const h = (ALTURA - porta) / 2;    // 75

    // Topo e base
    this.parede(0, 0, w, e);
    this.parede(w + porta, 0, w, e);
    this.parede(0, ALTURA - e, w, e);
    this.parede(w + porta, ALTURA - e, w, e);

    // Esquerda e direita
    this.parede(0, 0, e, h);
    this.parede(0, h + porta, e, h);
    this.parede(LARGURA - e, 0, e, h);
    this.parede(LARGURA - e, h + porta, e, h);
  }

  // Placeholder quadrado; troque depois por ImageSource/SpriteSheet
  private criarPlaceholder(offsetX: number, y: number, cor: Color): Actor {
    const tamanho = 12;
    const ator = new Actor({ pos: vec(LARGURA / 2 + offsetX, y) });
    ator.graphics.use(new Rectangle({ width: tamanho, height: tamanho, color: cor }));
    this.add(ator);
    return ator;
  }

  // Fileira: robô, jogador, Evil Otto, jogador, robô
  private criarFileiraSprites(): void {
    const y = 65;
    const esp = 30;

    this.criarPlaceholder(-2 * esp, y, COR_VERMELHO);
    this.criarPlaceholder(-esp, y, COR_VERDE);
    const otto = this.criarPlaceholder(0, y, COR_AMARELO);
    this.criarPlaceholder(esp, y, COR_VERDE);
    this.criarPlaceholder(2 * esp, y, COR_VERMELHO);

    // Pulinho do Evil Otto
    otto.actions.repeatForever((ctx) => {
      ctx.moveBy(0, -3, 300).moveBy(0, 3, 300);
    });
  }

  // Botão genérico: o fundo (Rectangle) e o texto (ator filho) ficam separados
  private criarBotao(cx: number, y: number, texto: string, acao: () => void): void {
    const fundo = new Rectangle({ width: 80, height: 20, color: COR_VERDE });

    const botao = new Actor({ pos: vec(cx, y), width: 80, height: 20 });
    botao.graphics.use(fundo);

    // Posição do filho é relativa ao pai, então (0, 0) fica centralizado no botão
    const rotulo = new Actor({ pos: vec(0, 0) });
    rotulo.graphics.use(new Text({ text: texto, font: this.criarFonte(8, COR_FUNDO) }));
    botao.addChild(rotulo);

    // Cursor ">" ao lado (inicialmente invisível)
    const cursor = this.criarTexto(">", cx - 52, y, 8, COR_VERDE);
    cursor.graphics.opacity = 0;

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

    botao.on("pointerdown", acao);

    this.add(botao);
  }

  // "INSERT COIN" piscando
  private criarInsertCoin(cx: number): void {
    const insertCoin = this.criarTexto("INSERT COIN", cx, 140, 8, COR_AMARELO);
    insertCoin.actions.repeatForever((ctx) => {
      ctx.fade(0, 500).fade(1, 500);
    });
  }
}