// src/ui/pausa.ts
import { Actor, Color, CollisionType, Scene, Text, vec } from "excalibur";
import { fontePixel } from "./fonte";
import { ALTURA, LARGURA } from "../config";

const Z = 500;

const VERDE = Color.fromHex("#33ff66");
const AMARELO = Color.fromHex("#ffd400");
const VERMELHO = Color.fromHex("#ff2d2d");

// Tela de pausa por cima da sala. Nenhum ator colide (não bloqueia tiros).
export class MenuPausa {
  private atores: Actor[] = [];

  constructor(
    private cena: Scene,
    private aoContinuar: () => void,
    private aoSair: () => void,
  ) {}

  mostrar(): void {
    const cx = LARGURA / 2;
    const cy = ALTURA / 2;

    const fundo = new Actor({
      pos: vec(cx, cy),
      width: LARGURA,
      height: ALTURA,
      color: Color.Black,
      opacity: 0.7,
      z: Z,
      collisionType: CollisionType.PreventCollision,
    });
    this.adicionar(fundo);
    this.adicionar(this.texto("PAUSADO", cx, cy - 40, 16));
    this.adicionar(this.botao("CONTINUAR", cy, VERDE, this.aoContinuar));
    this.adicionar(this.botao("MENU INICIAL", cy + 30, VERMELHO, this.aoSair));
    this.adicionar(this.texto("ESC - CONTINUAR", cx, cy + 60, 8));
  }

  ocultar(): void {
    for (const ator of this.atores) ator.kill();
    this.atores = [];
    document.body.style.cursor = "default";
  }

  private adicionar(ator: Actor): void {
    this.cena.add(ator);
    this.atores.push(ator);
  }

  private texto(conteudo: string, x: number, y: number, tamanho: number): Actor {
    const ator = new Actor({ pos: vec(x, y), z: Z + 1, collisionType: CollisionType.PreventCollision });
    ator.graphics.use(new Text({ text: conteudo, font: fontePixel(tamanho, AMARELO) }));
    return ator;
  }

  private botao(rotulo: string, y: number, cor: Color, acao: () => void): Actor {
    const botao = new Actor({
      pos: vec(LARGURA / 2, y),
      width: 110,
      height: 20,
      color: cor,
      z: Z + 1,
      collisionType: CollisionType.PreventCollision,
    });
    const texto = new Actor({ pos: vec(0, 0) });
    texto.graphics.use(new Text({ text: rotulo, font: fontePixel(8, Color.Black) }));
    botao.addChild(texto);

    botao.on("pointerenter", () => {
      botao.color = AMARELO;
      document.body.style.cursor = "pointer";
    });
    botao.on("pointerleave", () => {
      botao.color = cor;
      document.body.style.cursor = "default";
    });
    botao.on("pointerdown", acao);
    return botao;
  }
}
