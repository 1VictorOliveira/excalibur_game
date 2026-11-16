// src/efeitos.ts
// Efeitos visuais curtos reaproveitados por vários atores
import { Actor, Animation, AnimationStrategy, Color, CollisionType, Rectangle, Scene, SpriteSheet, Vector, vec } from "excalibur";
import { Resources } from "./resources";

/*
  Faísca de luz desenhada no Figma (6 quadros de 16x16).
  Substitui as partículas feitas por código, que pareciam artificiais e não eram pixeladas.
*/
let folhaFaisca: SpriteSheet | null = null;
function animacaoFaisca(): Animation {
  folhaFaisca ??= SpriteSheet.fromImageSource({
    image: Resources.Faisca,
    grid: { rows: 1, columns: 6, spriteWidth: 16, spriteHeight: 16 },
  });
  return Animation.fromSpriteSheet(folhaFaisca, [0, 1, 2, 3, 4, 5], 60, AnimationStrategy.End);
}

// Uma faísca no ponto (ricochete, bala batendo na parede...). escala inteira = continua pixelado
export function faisca(cena: Scene, pos: Vector, escala = 1, atraso = 0, z = 50): void {
  const ator = new Actor({ pos: pos.clone(), z, collisionType: CollisionType.PreventCollision });
  ator.scale = vec(escala, escala);
  const anim = animacaoFaisca();
  anim.events.on("end", () => ator.kill());
  if (atraso > 0) {
    ator.graphics.visible = false;
    ator.actions.delay(atraso).callMethod(() => {
      ator.graphics.visible = true;
      ator.graphics.use(anim);
    });
  } else {
    ator.graphics.use(anim);
  }
  cena.add(ator);
}

// Várias faíscas em volta de um ponto, uma atrás da outra: deixa claro QUE algo morreu e ONDE
export function estouro(cena: Scene, pos: Vector, quantidade: number, raio: number, escala = 1): void {
  faisca(cena, pos, escala * 2);
  for (let i = 0; i < quantidade; i++) {
    const angulo = (i / quantidade) * Math.PI * 2 + Math.random() * 0.6;
    const distancia = raio * (0.5 + Math.random() * 0.5);
    const ponto = pos.add(vec(Math.cos(angulo) * distancia, Math.sin(angulo) * distancia));
    faisca(cena, vec(Math.round(ponto.x), Math.round(ponto.y)), escala, 60 + i * 50);
  }
}

// Tela preta que some rápido: suaviza a troca de sala (antes era um corte seco)
export function cortina(cena: Scene, largura: number, altura: number, duracao = 220): void {
  const tela = new Actor({
    pos: vec(0, 0),
    anchor: vec(0, 0),
    z: 1000,
    collisionType: CollisionType.PreventCollision,
  });
  tela.graphics.use(new Rectangle({ width: largura, height: altura, color: Color.Black }));
  cena.add(tela);
  tela.actions.fade(0, duracao).die();
}
