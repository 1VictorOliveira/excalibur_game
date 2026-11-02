// src/actors/robos.ts
import { Actor, CollisionType, Color, Engine, Vector, vec } from "excalibur";
import { Bala } from "./bala";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";

export class Robo extends Actor implements Danificavel {
  velocidade = 25; // mais lento que o jogador (90)
  recargaTiro = 1000000; // ms entre tiros
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
      collisionGroup: Grupos.inimigo,
    });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    // Busca o jogador na cena
    const jogador = this.scene?.actors.find(a => a.name === "jogador");
    if (!jogador) {
      this.vel = vec(0, 0); // Para o robô quando o jogador morre
      return;
    }

    // Separação: evita sobreposição com outros robôs
    const outrosRobos = this.scene?.actors.filter(
      a => a.name === "robo" && a !== this
    ) || [];
    
    for (const outro of outrosRobos) {
      const dist = this.pos.distance(outro.pos);
      const distMinima = 15; // distância mínima entre robôs
      
      if (dist < distMinima && dist > 0) {
        // Empurra para longe do outro robô
        const direcaoSeparação = this.pos.sub(outro.pos).normalize();
        this.pos = this.pos.add(direcaoSeparação.scale(2));
      }
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

