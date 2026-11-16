// src/actors/bala.ts
import { Actor, Animation, Collider, CollisionGroup, CollisionType, Color, Engine, Scene, Vector, vec } from "excalibur";
import { podeLevarDano } from "../dano";
import { paredesDaCena, primeiraBatida } from "../colisao";
import { faisca } from "../efeitos";
import { Parede } from "./parede";

const RAIO = 2;

// Visual opcional por sprite; sem ele a bala é um círculo colorido
export type AparenciaBala = {
  voo: Animation; // desenhada para a direita
  ancora: Vector;
  aoAcabar: (cena: Scene, pos: Vector, angulo: number, naParede: boolean, dissipou: boolean) => void;
};

export class Bala extends Actor {
  dano = 1;
  private direcao: Vector;
  private rapidez: number;
  private readonly raio: number;
  private acabou = false; // evita acertar duas coisas no mesmo quadro

  constructor(
    pos: Vector,
    direcao: Vector,
    grupo: CollisionGroup,
    cor = Color.Yellow,
    private readonly aparencia?: AparenciaBala,
    velocidade = 220,
    private readonly tempoVida = 1500,
    raio = RAIO,
  ) {
    super({
      name: "bala",
      pos,
      radius: raio,
      color: cor,
      collisionType: CollisionType.Passive,
      collisionGroup: grupo,
    });
    this.direcao = direcao.normalize();
    this.rapidez = velocidade;
    this.raio = raio;
  }

  override onInitialize(): void {
    if (this.aparencia) {
      this.anchor = this.aparencia.ancora;
      this.rotation = this.direcao.toAngle();
      this.graphics.use(this.aparencia.voo);
    }
    this.actions.delay(this.tempoVida).die();
  }

  // Fim do alcance (sem bater em nada)
  dissipar(): void {
    if (this.acabou) return;
    this.acabou = true;
    if (this.scene) this.aparencia?.aoAcabar(this.scene, this.pos, this.direcao.toAngle(), false, true);
    this.kill();
  }

  // Movimento manual com varredura contra as paredes (ver colisao.ts)
  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.acabou || !this.scene) return;
    const passo = (this.rapidez * elapsed) / 1000;
    if (passo <= 0) return; // pausado
    const batida = primeiraBatida(paredesDaCena(this.scene), this.pos, this.direcao, passo, this.raio);
    if (batida) {
      this.pos = this.pos.add(this.direcao.scale(batida.avanco));
      this.terminar(true);
      return;
    }
    this.pos = this.pos.add(this.direcao.scale(passo));
    this.vel = vec(0, 0);
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    if (this.acabou) return;
    const alvo = outro.owner;
    if (podeLevarDano(alvo)) alvo.levarDano(this.dano);
    this.terminar(alvo instanceof Parede);
  }

  private terminar(naParede: boolean): void {
    this.acabou = true;
    if (this.scene) {
      if (this.aparencia) this.aparencia.aoAcabar(this.scene, this.pos, this.direcao.toAngle(), naParede, false);
      else if (naParede) faisca(this.scene, this.pos);
    }
    this.kill();
  }
}
