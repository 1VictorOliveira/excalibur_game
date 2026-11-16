// src/ui/hud-luz.ts
import { Actor, CollisionType, Color, Rectangle, Sprite, SpriteSheet, vec } from "excalibur";
import { Resources } from "../resources";
import { Jogador } from "../actors/jogador";
import { ALTURA, LARGURA } from "../config";

/*
  Ícone da habilidade atual (canto inferior esquerdo) e barra de carga do Foco.
  Ao trocar de habilidade, mostra os três ícones por um instante.
*/
const OPACIDADE_CANTO = 0.9;

function icones(): { normal: Sprite[]; escolhido: Sprite[] } {
  const folha = SpriteSheet.fromImageSource({
    image: Resources.Icones,
    grid: { rows: 2, columns: 3, spriteWidth: 16, spriteHeight: 16 },
  });
  return {
    normal: [0, 1, 2].map((i) => folha.getSprite(i, 0)),
    escolhido: [0, 1, 2].map((i) => folha.getSprite(i, 1)),
  };
}

export class HudLuz extends Actor {
  private sprites = icones();
  private ultimo = -1;
  private barra = new Actor({ anchor: vec(0, 0), z: 101, collisionType: CollisionType.PreventCollision });
  private retanguloBarra = new Rectangle({ width: 1, height: 2, color: Color.White });
  private seletor: Actor[] = [];

  constructor(private jogador: Jogador) {
    super({ pos: vec(16, ALTURA - 18), z: 100, collisionType: CollisionType.PreventCollision });
  }

  override onInitialize(): void {
    this.graphics.opacity = OPACIDADE_CANTO;
    this.barra.pos = vec(this.pos.x - 7, this.pos.y + 9);
    this.barra.graphics.use(this.retanguloBarra);
    this.scene?.add(this.barra);

    // Seletor com os três ícones
    for (let i = 0; i < 3; i++) {
      const icone = new Actor({
        pos: vec(LARGURA / 2 + (i - 1) * 18, ALTURA - 18),
        z: 102,
        collisionType: CollisionType.PreventCollision,
      });
      icone.graphics.opacity = 0;
      this.seletor.push(icone);
      this.scene?.add(icone);
    }
  }

  override onPreUpdate(): void {
    const indice = this.jogador.indiceHabilidade;

    if (indice !== this.ultimo) {
      const primeiraVez = this.ultimo === -1;
      this.ultimo = indice;
      this.graphics.use(this.sprites.escolhido[indice]);
      this.retanguloBarra.color = this.jogador.habilidadeAtual.cor;
      if (!primeiraVez) this.mostrarSeletor(indice);
    }

    // Carga do Foco
    const carga = this.jogador.habilidadeAtual.carga();
    this.retanguloBarra.width = Math.max(1, Math.round(14 * carga));
    this.barra.graphics.opacity = carga > 0 ? 1 : 0;
  }

  private mostrarSeletor(escolhido: number): void {
    this.graphics.opacity = 1;
    this.actions.clearActions();
    this.actions.delay(500).fade(OPACIDADE_CANTO, 300);

    this.seletor.forEach((icone, i) => {
      icone.graphics.use(i === escolhido ? this.sprites.escolhido[i] : this.sprites.normal[i]);
      icone.actions.clearActions();
      icone.graphics.opacity = i === escolhido ? 1 : 0.6;
      icone.pos.y = ALTURA - 18 - (i === escolhido ? 2 : 0);
      icone.actions.delay(900).fade(0, 250);
    });
  }
}
