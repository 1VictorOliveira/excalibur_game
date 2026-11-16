// src/luz/projeteis.ts
import { Actor, Collider, Color, CollisionType, Engine, Ray, Vector, vec } from "excalibur";
import { animRaio, impactoFoco } from "./visual-tiros";
import { podeLevarDano } from "../dano";
import { paredesDaCena, primeiraBatida, refletir } from "../colisao";
import { faisca } from "../efeitos";
import { Grupos } from "../grupos";
import { Parede } from "../actors/parede";

/*
  Feixe refletido (lei da reflexão): v' = v - 2 (v · n) n,
  n = normal da parede atingida.
*/
const RAIO_FEIXE = 2;

export class FeixeRefletido extends Actor {
  private ricochetesRestantes: number;
  private direcao: Vector;
  private rapidez = 200; // px/s
  private acabou = false;

  constructor(pos: Vector, direcao: Vector, cor: Color, ricochetes = 3) {
    super({
      name: "feixe",
      pos,
      radius: RAIO_FEIXE,
      color: cor,
      collisionType: CollisionType.Passive,
      collisionGroup: Grupos.tiroJogador,
    });
    this.ricochetesRestantes = ricochetes;
    this.direcao = direcao.normalize();
  }

  override onInitialize(): void {
    this.actions.delay(4000).die(); // limite de vida
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.acabou || !this.scene) return;
    let restante = (this.rapidez * elapsed) / 1000;
    if (restante <= 0) return; // pausado
    const paredes = paredesDaCena(this.scene);
    let pos = this.pos.clone();

    // Até 3 batidas no mesmo quadro (quinas)
    for (let i = 0; i < 3 && restante > 0; i++) {
      const batida = primeiraBatida(paredes, pos, this.direcao, restante, RAIO_FEIXE);
      if (!batida) {
        pos = pos.add(this.direcao.scale(restante));
        break;
      }
      pos = pos.add(this.direcao.scale(batida.avanco));
      restante -= batida.avanco;
      if (this.ricochetesRestantes <= 0) {
        this.pos = pos;
        this.terminar();
        return;
      }
      this.ricochetesRestantes--;
      this.direcao = refletir(this.direcao, batida.normal);
      faisca(this.scene, pos);
    }
    this.pos = pos;
    this.vel = vec(0, 0);
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Paredes já tratadas na varredura
    const alvo = outro.owner;
    if (this.acabou || alvo instanceof Parede) return;
    if (podeLevarDano(alvo)) alvo.levarDano(1);
    this.terminar();
  }

  private terminar(): void {
    this.acabou = true;
    this.kill();
  }
}

// Raio focado: instantâneo, atravessa inimigos até a primeira parede
export class RaioFocado extends Actor {
  // nivel: 0 fraco, 1 médio, 2 carga cheia
  constructor(origem: Vector, fim: Vector, nivel: number) {
    // Sprite horizontal, girado na direção do tiro
    super({ pos: origem, anchor: vec(0, 0.5), z: 10, collisionType: CollisionType.PreventCollision });
    const caminho = fim.sub(origem);
    this.rotation = caminho.toAngle();
    this.graphics.use(animRaio(nivel, caminho.size));
  }

  override onInitialize(): void {
    this.actions.delay(150).fade(0, 200).die();
  }

  static disparar(atirador: Actor, direcao: Vector, dano: number): void {
    const cena = atirador.scene;
    if (!cena) return;

    const dir = direcao.normalize();
    const origem = atirador.pos.add(dir.scale(6));
    const alcanceMaximo = 400;

    const acertos = cena.physics.rayCast(new Ray(origem, dir), {
      maxDistance: alcanceMaximo,
      searchAllColliders: true,
      filter: (acerto) => {
        const dono = acerto.collider.owner;
        return dono !== atirador && (dono instanceof Parede || podeLevarDano(dono));
      },
    });

    let distanciaParede = alcanceMaximo;
    for (const acerto of acertos) {
      if (acerto.collider.owner instanceof Parede) {
        distanciaParede = Math.min(distanciaParede, acerto.distance);
      }
    }

    const nivel = Math.max(0, Math.min(2, dano - 1));

    // Dano em todos antes da parede
    for (const acerto of acertos) {
      const alvo = acerto.collider.owner;
      if (acerto.distance < distanciaParede && podeLevarDano(alvo)) {
        impactoFoco(cena, acerto.point, nivel);
        alvo.levarDano(dano);
      }
    }

    const fim = origem.add(dir.scale(distanciaParede));
    cena.add(new RaioFocado(origem, fim, nivel));
    impactoFoco(cena, fim, nivel);
  }
}
