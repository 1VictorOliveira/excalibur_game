// src/luz/visual-tiros.ts
// Sprites dos tiros: Prisma (3 cores) e Foco (carga, raio, impacto)
import {
  Actor,
  Animation,
  AnimationStrategy,
  CollisionType,
  Graphic,
  GraphicsGroup,
  ImageSource,
  Scene,
  Sprite,
  SpriteSheet,
  Vector,
  vec,
} from "excalibur";
import { Resources } from "../resources";

function folha(imagem: ImageSource, linhas: number, colunas: number, w: number, h: number): SpriteSheet {
  return SpriteSheet.fromImageSource({
    image: imagem,
    grid: { rows: linhas, columns: colunas, spriteWidth: w, spriteHeight: h },
  });
}

function linha(f: SpriteSheet, linha: number, quadros: number[] = [0, 1, 2, 3]): Sprite[] {
  return quadros.map((c) => f.getSprite(c, linha)!);
}

// Animação única em um ponto, depois remove o ator
function efeito(cena: Scene, pos: Vector, anim: Animation, angulo = 0, ancora = vec(0.5, 0.5), z = 30): void {
  const ator = new Actor({ pos: pos.clone(), z, anchor: ancora, collisionType: CollisionType.PreventCollision });
  ator.rotation = angulo;
  anim.events.on("end", () => ator.kill());
  ator.graphics.use(anim);
  cena.add(ator);
}

// cor: 0 vermelho, 1 verde, 2 azul
export function animPrismaVoo(cor: number): Animation {
  const f = folha(Resources.TiroPrisma, 3, 4, 24, 12);
  return new Animation({
    frames: linha(f, cor).map((graphic) => ({ graphic, duration: 70 })),
    strategy: AnimationStrategy.Loop,
  });
}
// Ponto do sprite que fica na posição da bala
export const ANCORA_PRISMA = vec(20 / 24, 6 / 12);

// comBatida: inclui o quadro do choque com a parede
export function impactoPrisma(cena: Scene, pos: Vector, angulo: number, cor: number, comBatida: boolean): void {
  const f = folha(Resources.TiroPrismaImpacto, 3, 4, 16, 16);
  const quadros = comBatida ? [0, 1, 2, 3] : [1, 2, 3];
  const anim = new Animation({
    frames: linha(f, cor, quadros).map((graphic) => ({ graphic, duration: 70 })),
    strategy: AnimationStrategy.End,
  });
  efeito(cena, pos, anim, angulo, comBatida ? vec(15 / 16, 0.5) : vec(0.5, 0.5));
}

// Bola de carga do Foco
export class OrbeCarga extends Actor {
  private niveis: Animation[];
  private nivel = -1;

  constructor() {
    super({ z: 25, collisionType: CollisionType.PreventCollision });
    const f = folha(Resources.FocoCarga, 4, 4, 12, 12);
    this.niveis = [0, 1, 2, 3].map(
      (n) =>
        new Animation({
          frames: linha(f, n).map((graphic) => ({ graphic, duration: 90 })),
          strategy: AnimationStrategy.Loop,
        }),
    );
  }

  // carga de 0 a 1 -> linha 0 a 3 da folha
  mostrar(carga: number): void {
    const n = carga < 0.15 ? 0 : carga < 1 / 3 ? 1 : carga < 2 / 3 ? 2 : 3;
    if (n !== this.nivel) {
      this.nivel = n;
      this.graphics.use(this.niveis[n]);
    }
  }
}

// Raio = boca + corpo repetido + ponta, no comprimento pedido
export function animRaio(nivel: number, comprimento: number): Animation {
  const inicio = folha(Resources.FocoInicio, 3, 4, 16, 16);
  const ponta = folha(Resources.FocoPonta, 3, 4, 16, 16);
  const L = Math.max(32, Math.round(comprimento));
  const quadros: { graphic: Graphic; duration: number }[] = [];
  for (let q = 0; q < 4; q++) {
    const membros: { graphic: Graphic; offset: Vector }[] = [];
    // último pedaço do corpo é cortado no que sobra
    for (let x = 16; x < L - 16; x += 16) {
      const largura = Math.min(16, L - 16 - x);
      const pedaco = new Sprite({
        image: Resources.FocoCorpo,
        sourceView: { x: q * 16, y: nivel * 8, width: largura, height: 8 },
        destSize: { width: largura, height: 8 },
      });
      membros.push({ graphic: pedaco, offset: vec(x, 4) });
    }
    membros.push({ graphic: inicio.getSprite(q, nivel)!, offset: vec(0, 0) });
    membros.push({ graphic: ponta.getSprite(q, nivel)!, offset: vec(L - 16, 0) });
    quadros.push({ graphic: new GraphicsGroup({ members: membros }), duration: 60 });
  }
  return new Animation({ frames: quadros, strategy: AnimationStrategy.Loop });
}

// Impacto do raio
export function impactoFoco(cena: Scene, pos: Vector, nivel: number): void {
  const f = folha(Resources.FocoImpacto, 3, 4, 32, 32);
  const anim = new Animation({
    frames: linha(f, nivel).map((graphic) => ({ graphic, duration: 70 })),
    strategy: AnimationStrategy.End,
  });
  efeito(cena, pos, anim, 0, vec(0.5, 0.5), 31);
}
