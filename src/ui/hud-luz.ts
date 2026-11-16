// src/ui/hud-luz.ts
import { Actor, CollisionType, Color, Rectangle, Sprite, SpriteSheet, vec } from "excalibur";
import { Resources } from "../resources";
import { Jogador } from "../actors/jogador";

/*
  Habilidade de luz escolhida, com os ícones desenhados no Figma (32x32):
  REFLEXÃO, FOCO e PRISMA, cada um com versão normal e "escolhido" (moldura dourada).

  - No canto de baixo fica só o ícone da habilidade atual, meio transparente para não
    esconder o chão. Embaixo dele, a barra de carga do Foco.
  - Ao trocar (1, 2, 3 ou Q), aparece a barra com os três ícones no centro de baixo,
    com o escolhido em dourado, e some sozinha.
*/
const LARGURA_TELA = 320;
const ALTURA_TELA = 180;
const OPACIDADE_CANTO = 0.9;

function icones(): { normal: Sprite[]; escolhido: Sprite[] } {
  const folha = SpriteSheet.fromImageSource({
    image: Resources.Icones,
    grid: { rows: 2, columns: 3, spriteWidth: 32, spriteHeight: 32 },
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
    // canto de baixo à esquerda, dentro da parede
    super({ pos: vec(22, ALTURA_TELA - 24), z: 100, collisionType: CollisionType.PreventCollision });
  }

  override onInitialize(): void {
    this.graphics.opacity = OPACIDADE_CANTO;
    this.barra.pos = vec(this.pos.x - 15, this.pos.y + 17);
    this.barra.graphics.use(this.retanguloBarra);
    this.scene?.add(this.barra);

    // Barra com os três ícones (aparece só ao trocar de habilidade)
    for (let i = 0; i < 3; i++) {
      const icone = new Actor({
        pos: vec(LARGURA_TELA / 2 + (i - 1) * 34, ALTURA_TELA - 24),
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

    // Barra de carga do Foco (some nas outras habilidades)
    const carga = this.jogador.habilidadeAtual.carga();
    this.retanguloBarra.width = Math.max(1, Math.round(30 * carga));
    this.barra.graphics.opacity = carga > 0 ? 1 : 0;
  }

  private mostrarSeletor(escolhido: number): void {
    // O ícone do canto dá um "pulo" de brilho
    this.graphics.opacity = 1;
    this.actions.clearActions();
    this.actions.delay(500).fade(OPACIDADE_CANTO, 300);

    this.seletor.forEach((icone, i) => {
      icone.graphics.use(i === escolhido ? this.sprites.escolhido[i] : this.sprites.normal[i]);
      icone.actions.clearActions();
      icone.graphics.opacity = i === escolhido ? 1 : 0.6;
      // o escolhido sobe 2 px, os outros ficam na linha
      icone.pos.y = ALTURA_TELA - 24 - (i === escolhido ? 2 : 0);
      icone.actions.delay(900).fade(0, 250);
    });
  }
}
