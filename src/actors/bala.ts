// src/actors/bala.ts
import { Actor, Collider, CollisionGroup, CollisionType, Color, Engine, Vector, vec } from "excalibur";
import { podeLevarDano } from "../dano";
import { paredesDaCena, primeiraBatida } from "../colisao";
import { faisca } from "../efeitos";
import { Parede } from "./parede";

const RAIO = 2;

export class Bala extends Actor {
  dano = 1;
  private direcao: Vector;
  private rapidez = 220; // px/s
  private acabou = false; // evita acertar duas coisas no mesmo quadro

  constructor(pos: Vector, direcao: Vector, grupo: CollisionGroup, cor = Color.Yellow) {
    super({
      name: "bala",
      pos,
      radius: RAIO,
      color: cor,
      collisionType: CollisionType.Passive,
      collisionGroup: grupo, // quem ela pode acertar é decidido pelo grupo
    });
    this.direcao = direcao.normalize();
  }

  override onInitialize(): void {
    this.actions.delay(1500).die();
  }

  // A bala se move "na mão": antes de andar, confere se alguma parede está no caminho
  // do quadro inteiro. Assim ela nunca pula uma parede, mesmo num quadro lento.
  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.acabou || !this.scene) return;
    const passo = (this.rapidez * elapsed) / 1000;
    if (passo <= 0) return; // pausado (o tempo do jogo está parado)
    const batida = primeiraBatida(paredesDaCena(this.scene), this.pos, this.direcao, passo, RAIO);
    if (batida) {
      this.pos = this.pos.add(this.direcao.scale(batida.avanco));
      this.terminar(true);
      return;
    }
    this.pos = this.pos.add(this.direcao.scale(passo));
    this.vel = vec(0, 0);
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // O grupo já filtrou: se chegou aqui, é um alvo válido ou uma parede.
    if (this.acabou) return;
    const alvo = outro.owner;
    if (podeLevarDano(alvo)) alvo.levarDano(this.dano);
    this.terminar(alvo instanceof Parede);
  }

  private terminar(naParede: boolean): void {
    this.acabou = true;
    if (naParede && this.scene) faisca(this.scene, this.pos); // faísca do Figma
    this.kill();
  }
}
