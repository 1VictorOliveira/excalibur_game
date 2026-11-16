// src/efeitos.ts
// Efeitos visuais curtos reaproveitados por vários atores
import { Actor, Color, CollisionType, EmitterType, ParticleEmitter, Rectangle, Scene, Vector, vec } from "excalibur";

// Explosão de partículas: deixa claro QUE algo morreu e ONDE (antes os atores só sumiam)
export function explosao(cena: Scene, pos: Vector, inicio: string, fim: string, quantidade = 24): void {
  const emissor = new ParticleEmitter({
    pos: pos.clone(),
    emitterType: EmitterType.Circle,
    radius: 2,
    isEmitting: false,
    particle: {
      life: 600,
      minSpeed: 20,
      maxSpeed: 70,
      minSize: 1,
      maxSize: 3,
      beginColor: Color.fromHex(inicio),
      endColor: Color.fromHex(fim),
      fade: true,
    },
  });
  emissor.z = 50;
  cena.add(emissor);
  emissor.emitParticles(quantidade);
  emissor.actions.delay(800).die(); // remove o emissor depois que as partículas somem
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
