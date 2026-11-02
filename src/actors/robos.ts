// src/actors/robos.ts
import { Actor, Collider, CollisionType, Color, Engine, Vector, vec } from "excalibur";
import { Bala } from "./bala";
import { Jogador } from "./jogador";
import { Parede } from "./parede";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";

export class Robo extends Actor implements Danificavel {
  velocidade = 25; // mais lento que o jogador (90)
  recargaTiro = 1000; // ms entre tiros
  hp = 2; // aguenta 2 tiros antes de morrer
  private tempoRecarga = 0;

  constructor(pos: Vector) {
    super({
      name: "robo",
      pos,
      width: 10,
      height: 14,
      color: Color.fromHex("#d84a4a"),
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.robo,
    });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    // Busca o jogador na cena
    const jogador = this.scene?.actors.find(a => a.name === "jogador");
    if (!jogador) {
      this.vel = vec(0, 0); // Para o robô quando o jogador morre
      return;
    }

    // Calcula direção até o jogador
    const direcao = jogador.pos.sub(this.pos);
    const distancia = direcao.size;

    // Só persegue se estiver longe o suficiente (evita sobreposição)
    if (distancia > 15) {
      const direcaoNormalizada = direcao.normalize();
      this.vel = direcaoNormalizada.scale(this.velocidade);
    } else {
      this.vel = vec(0, 0);
    }

    // Lógica de tiro
    this.tempoRecarga -= elapsed;
    if (this.tempoRecarga <= 0 && distancia > 0) {
      this.atirar(direcao);
      this.tempoRecarga = this.recargaTiro;
    }
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Se colidir com outro robô, ambos se autodestroem
    if (outro.owner instanceof Robo) {
      this.kill();
      outro.owner.kill();
    }
    // Se colidir com parede, se autodestrói
    if (outro.owner instanceof Parede) {
      this.kill();
    }
    // Se colidir com jogador, se autodestrói e tira uma vida do jogador
    if (outro.owner instanceof Jogador) {
      outro.owner.levarDano(1);
      this.kill();
    }
  }

  atirar(direcao: Vector): void {
    // Bala nasce um pouco à frente do robô
    const saida = this.pos.add(direcao.normalize().scale(10));
    this.scene?.add(new Bala(saida, direcao, Grupos.tiroInimigo, Color.Red));
  }

  levarDano(quantidade: number): void {
    this.hp -= quantidade;
    if (this.hp <= 0) {
      this.kill();
    } else {
      // Pisca quando leva dano mas não morre
      this.actions.blink(80, 80, 3);
    }
  }
}

