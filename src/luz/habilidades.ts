// src/luz/habilidades.ts
import { Actor, Color, Vector } from "excalibur";
import { Bala } from "../actors/bala";
import { Grupos } from "../grupos";
import { FeixeRefletido, RaioFocado } from "./projeteis";
import { saidaLivre } from "../colisao";

/*
  As "armas" do jogo são aplicações da física da luz.
  Toda habilidade recebe, a cada quadro, para onde o jogador está mirando
  (vetor zero = não está atirando) e decide o que fazer.
*/
export interface Habilidade {
  nome: string;
  cor: Color;
  atualizar(jogador: Actor, mira: Vector, elapsed: number): void;
  cancelar(): void; // chamado ao trocar de habilidade
  carga(): number; // 0 a 1, para mostrar no HUD (só o Foco usa)
}

// 1) REFLEXÃO — o feixe ricocheteia nas paredes (até 3 vezes)
export class Reflexao implements Habilidade {
  nome = "REFLEXAO";
  cor = Color.fromHex("#fff4b0");
  private recarga = 0;

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (mira.size === 0 || this.recarga > 0) return;
    this.recarga = 450;
    const cena = jogador.scene;
    // Colado numa parede, o feixe não nasce do outro lado dela
    if (!cena || !saidaLivre(cena, jogador.pos, mira, 10, 2)) return;
    const saida = jogador.pos.add(mira.normalize().scale(10));
    cena.add(new FeixeRefletido(saida, mira, this.cor, 3));
  }
  cancelar(): void {}
  carga(): number {
    return 0;
  }
}

// 2) FOCO — segure para concentrar a luz, solte para disparar um laser que atravessa inimigos
export class Foco implements Habilidade {
  nome = "FOCO";
  cor = Color.fromHex("#39d5ff");
  private tempoCarregando = 0;
  private ultimaMira: Vector | null = null;
  private recarga = 0;
  private readonly cargaMaxima = 1200; // ms para carga total

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (this.recarga > 0) return;

    if (mira.size > 0) {
      // Segurando: acumula carga
      this.tempoCarregando = Math.min(this.cargaMaxima, this.tempoCarregando + elapsed);
      this.ultimaMira = mira.clone();
      return;
    }

    // Soltou: dispara com dano proporcional à carga (1 a 3)
    if (this.ultimaMira) {
      const dano = 1 + Math.floor(this.carga() * 2.99);
      RaioFocado.disparar(jogador, this.ultimaMira, dano, this.cor);
      this.cancelar();
      this.recarga = 300;
    }
  }
  cancelar(): void {
    this.tempoCarregando = 0;
    this.ultimaMira = null;
  }
  carga(): number {
    return this.tempoCarregando / this.cargaMaxima;
  }
}

// 3) PRISMA — a luz se dispersa em 3 raios coloridos em leque (como o arco-íris do prisma)
export class Prisma implements Habilidade {
  nome = "PRISMA";
  cor = Color.fromHex("#ff4fd8");
  private recarga = 0;
  private readonly abertura = 0.3; // radianos entre os raios (~17°)
  private readonly cores = ["#ff4f4f", "#4fff7a", "#4f8bff"].map((c) => Color.fromHex(c));

  atualizar(jogador: Actor, mira: Vector, elapsed: number): void {
    this.recarga -= elapsed;
    if (mira.size === 0 || this.recarga > 0) return;

    const base = mira.toAngle();
    [-1, 0, 1].forEach((lado, i) => {
      const dir = Vector.fromAngle(base + lado * this.abertura);
      if (!jogador.scene || !saidaLivre(jogador.scene, jogador.pos, dir, 10, 2)) return; // raio bloqueado pela parede
      const saida = jogador.pos.add(dir.scale(10));
      const raio = new Bala(saida, dir, Grupos.tiroJogador, this.cores[i]);
      raio.actions.clearActions();
      raio.actions.delay(500).die(); // alcance curto: a luz dispersa perde força
      jogador.scene?.add(raio);
    });
    this.recarga = 550;
  }
  cancelar(): void {}
  carga(): number {
    return 0;
  }
}
