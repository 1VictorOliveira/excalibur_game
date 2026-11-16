// src/scenes/configuracoes.ts
import { Actor, Color, CollisionType, Engine, KeyEvent, Keys, Scene, Text, vec } from "excalibur";
import { Resources } from "../resources";
import { BotaoSprite } from "../ui/botao-sprite";
import { montarFundo } from "../cenario/fundo";
import { fontePixel } from "../ui/fonte";
import { cortina } from "../efeitos";

const LARGURA = 320;
const ALTURA = 180;

/*
  Tela de OPÇÕES.
  Por enquanto está vazia de propósito: as opções
  novas entram aqui depois. A estrutura (título, voltar com ESC ou clique) já está pronta.
*/
export class Configuracoes extends Scene {
  private botaoVoltar!: BotaoSprite;
  private saindo = false;

  private aoApertar = (evt: KeyEvent): void => {
    if (evt.key === Keys.Escape || evt.key === Keys.Enter || evt.key === Keys.Space) this.voltar();
  };

  override onInitialize(engine: Engine): void {
    montarFundo(this, engine);

    // Título: o botão OPÇÕES do Figma em tamanho 2x (escala inteira continua pixelada)
    const titulo = new BotaoSprite(Resources.BotaoOpcoes, vec(LARGURA / 2, 40));
    titulo.scale = vec(2, 2);
    titulo.escolher(true);
    this.add(titulo);
    const emBreve = this.texto("EM BREVE", LARGURA / 2, ALTURA / 2, 8, "#8f7fbf");
    emBreve.actions.repeatForever((ctx) => ctx.fade(0.4, 900).fade(1, 900)); // "respira" devagar

    // VOLTAR é a única opção, então já fica "escolhido" (brilhando)
    this.botaoVoltar = new BotaoSprite(Resources.BotaoVoltar, vec(LARGURA / 2, ALTURA - 30));
    this.add(this.botaoVoltar);
    // Área de clique um pouco maior que o botão (sem colisão física)
    const area = new Actor({
      pos: this.botaoVoltar.pos.clone(),
      width: 96,
      height: 16,
      collisionType: CollisionType.PreventCollision,
    });
    area.on("pointerenter", () => (document.body.style.cursor = "pointer"));
    area.on("pointerleave", () => (document.body.style.cursor = "default"));
    area.on("pointerdown", () => this.voltar());
    this.add(area);
  }

  override onActivate(): void {
    this.saindo = false;
    this.botaoVoltar.escolher(false);
    this.botaoVoltar.escolher(true);
    this.engine.input.keyboard.on("press", this.aoApertar);
    cortina(this, LARGURA, ALTURA, 300);
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
    document.body.style.cursor = "default";
  }

  private voltar(): void {
    if (this.saindo) return;
    this.saindo = true;
    this.botaoVoltar.apertar(); // animação de apertar do Figma, depois volta
    this.engine.clock.schedule(() => this.engine.goToScene("menu"), 220);
  }

  private texto(conteudo: string, x: number, y: number, tamanho: number, cor: string): Actor {
    const ator = new Actor({ pos: vec(x, y), z: 60 });
    ator.graphics.use(new Text({ text: conteudo, font: fontePixel(tamanho, Color.fromHex(cor)) }));
    this.add(ator);
    return ator;
  }
}
