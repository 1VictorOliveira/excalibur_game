// src/luz/habilidades.ts
import { Actor, Color, Vector } from "excalibur";
import { Bala } from "../actors/bala";
import { Grupos } from "../grupos";
import { FeixeRefletido, RaioFocado } from "./projeteis";
import { saidaLivre } from "../colisao";
import { ANCORA_PRISMA, OrbeCarga, animPrismaVoo, impactoPrisma } from "./visual-tiros";

// Habilidades de luz. Recebem a mira a cada quadro (vetor zero = sem tiro).
export interface Habilidade {
  nome: string;
  cor: Color;
  atualizar(jogador: Actor, mira: Vector, elapsed: number): void;
  cancelar(): void; // ao trocar de habilidade
  carga(): number; // 0 a 1 (só o Foco usa)
}

// REFLEXÃO: o feixe ricocheteia até 3 vezes
export class Reflexao implements Habilidade {
  nome = "REFLEXAO";
  cor = Color.fromHex("#fff4b0");
  private recarga = 0;

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (mira.size === 0 || this.recarga > 0) return;
    this.recarga = 450;
    const cena = jogador.scene;
    if (!cena || !saidaLivre(cena, jogador.pos, mira, 10, 2)) return;
    const saida = jogador.pos.add(mira.normalize().scale(10));
    cena.add(new FeixeRefletido(saida, mira, this.cor, 3));
  }
  cancelar(): void {}
  carga(): number {
    return 0;
  }
}

// FOCO: segurar carrega, soltar dispara um raio que atravessa inimigos
export class Foco implements Habilidade {
  nome = "FOCO";
  cor = Color.fromHex("#39d5ff");
  private tempoCarregando = 0;
  private ultimaMira: Vector | null = null;
  private recarga = 0;
  private readonly cargaMaxima = 1200; // ms
  private orbe: OrbeCarga | null = null;

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (this.recarga > 0) return;

    if (mira.size > 0) {
      this.tempoCarregando = Math.min(this.cargaMaxima, this.tempoCarregando + elapsed);
      this.ultimaMira = mira.clone();
      this.mostrarOrbe(jogador, mira);
      return;
    }

    // Dano de 1 a 3, conforme a carga
    if (this.ultimaMira) {
      const dano = 1 + Math.floor(this.carga() * 2.99);
      RaioFocado.disparar(jogador, this.ultimaMira, dano);
      this.cancelar();
      this.recarga = 300;
    }
  }
  cancelar(): void {
    this.tempoCarregando = 0;
    this.ultimaMira = null;
    this.orbe?.kill();
    this.orbe = null;
  }

  // Bola de carga na frente da personagem
  private mostrarOrbe(jogador: Actor, mira: Vector): void {
    if (!jogador.scene) return;
    if (!this.orbe || this.orbe.isKilled() || this.orbe.scene !== jogador.scene) {
      this.orbe = new OrbeCarga();
      jogador.scene.add(this.orbe);
    }
    this.orbe.pos = jogador.pos.add(mira.normalize().scale(9));
    this.orbe.mostrar(this.carga());
  }
  carga(): number {
    return this.tempoCarregando / this.cargaMaxima;
  }
}

// PRISMA: 3 raios coloridos em leque, de alcance curto
export class Prisma implements Habilidade {
  nome = "PRISMA";
  cor = Color.fromHex("#ff4fd8");
  private recarga = 0;
  private readonly abertura = 0.3; // rad entre os raios
  private readonly cores = ["#ff4f4f", "#4fff7a", "#4f8bff"].map((c) => Color.fromHex(c));

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (mira.size === 0 || this.recarga > 0) return;

    const base = mira.toAngle();
    [-1, 0, 1].forEach((lado, i) => {
      const dir = Vector.fromAngle(base + lado * this.abertura);
      if (!jogador.scene || !saidaLivre(jogador.scene, jogador.pos, dir, 10, 2)) return;
      const saida = jogador.pos.add(dir.scale(10));
      const raio = new Bala(saida, dir, Grupos.tiroJogador, this.cores[i], {
        voo: animPrismaVoo(i),
        ancora: ANCORA_PRISMA,
        aoAcabar: (cena, pos, angulo, naParede) => impactoPrisma(cena, pos, angulo, i, naParede),
      });
      raio.actions.clearActions();
      raio.actions.delay(500).callMethod(() => raio.dissipar());
      jogador.scene?.add(raio);
    });
    this.recarga = 550;
  }
  cancelar(): void {}
  carga(): number {
    return 0;
  }
}
