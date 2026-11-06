// src/scenes/sala.ts
import { Color, Engine, Scene, Vector, vec } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Robo } from "../actors/robos";
import { COLUNAS, LINHAS, montarLabirinto } from "../salas/labirinto";
import { Estado, Direcao } from "../estado";
import { sementeDaSala } from "../salas/mapa";

const LARGURA = 320;
const ALTURA = 180;
const MARGEM = 20; // distância segura da parede para a entrada

// Direção oposta (por onde o jogador entra na sala seguinte)
const OPOSTA: Record<Direcao, Direcao> = {
  norte: "sul",
  sul: "norte",
  leste: "oeste",
  oeste: "leste",
};

// Posição de entrada na sala, baseada na porta por onde o jogador veio
function posicaoDeEntrada(direcao: Direcao | null): Vector {
  switch (direcao) {
    case "norte": return vec(LARGURA / 2, MARGEM);
    case "sul":   return vec(LARGURA / 2, ALTURA - MARGEM);
    case "leste": return vec(LARGURA - MARGEM, ALTURA / 2);
    case "oeste": return vec(MARGEM, ALTURA / 2);
    default:      return vec(MARGEM, ALTURA / 2); // sala inicial
  }
}

// Direção para a qual o jogador olha ao entrar
function direcaoDeEntrada(direcao: Direcao | null): Vector {
  switch (direcao) {
    case "norte": return vec(0, 1);   // olha para baixo
    case "sul":   return vec(0, -1);  // olha para cima
    case "leste": return vec(-1, 0);  // olha para esquerda
    case "oeste": return vec(1, 0);   // olha para direita
    default:      return vec(1, 0);
  }
}

export class Sala extends Scene {
  private transicaoPendente: Direcao | null = null;

  override onInitialize(engine: Engine): void {
    this.montar(engine);
  }

  override onPreUpdate(engine: Engine, _elapsed: number): void {
    // Processa transição pendente no início do frame
    if (this.transicaoPendente) {
      const direcao = this.transicaoPendente;
      this.transicaoPendente = null;
      this.executarTransicao(direcao, engine);
      return;
    }

    // Detecta se o jogador escapou por alguma abertura
    const jogador = this.actors.find(a => a.name === "jogador") as Jogador | undefined;
    if (!jogador) return;

    const saida = this.verificarSaida(jogador);
    if (saida) {
      Estado.hp = jogador.hp;
      this.transicaoPendente = saida;
    }
  }

  // Verifica se o jogador passou das bordas da sala (só possível pelas portas)
  private verificarSaida(jogador: Jogador): Direcao | null {
    if (jogador.pos.x < 0) return "oeste";
    if (jogador.pos.x > LARGURA) return "leste";
    if (jogador.pos.y < 0) return "norte";
    if (jogador.pos.y > ALTURA) return "sul";
    return null;
  }

  private executarTransicao(direcao: Direcao, engine: Engine): void {
    // Atualiza coordenadas da sala no mapa global
    switch (direcao) {
      case "norte": Estado.coordY--; break;
      case "sul":   Estado.coordY++; break;
      case "leste": Estado.coordX++; break;
      case "oeste": Estado.coordX--; break;
    }
    Estado.portaEntrada = OPOSTA[direcao];

    // Remove todos os atores da cena
    for (const ator of [...this.actors]) {
      ator.kill();
    }

    // Reconstrói a sala
    this.montar(engine);
  }

  private montar(engine: Engine): void {
    this.backgroundColor = Color.fromHex("#0d0d14");

    // Labirinto determinístico para esta sala
    const semente = sementeDaSala(Estado.coordX, Estado.coordY);
    const labirinto = montarLabirinto(this, engine, { semente });

    // Posiciona o jogador na porta de entrada
    const posEntrada = posicaoDeEntrada(Estado.portaEntrada);
    const dirEntrada = direcaoDeEntrada(Estado.portaEntrada);
    const jogador = new Jogador(posEntrada, Estado.hp, dirEntrada);
    this.add(jogador);

    // Robôs nascem em células distantes da entrada
    const livres: [number, number][] = [];
    for (let c = 0; c < COLUNAS; c++) {
      for (let l = 0; l < LINHAS; l++) {
        const centro = labirinto.centroDaCelula(c, l);
        if (centro.distance(posEntrada) > 50) {
          livres.push([c, l]);
        }
      }
    }
    livres.sort(() => Math.random() - 0.5);

    const quantidadeRobos = 3;
    for (const [c, l] of livres.slice(0, quantidadeRobos)) {
      this.add(new Robo(labirinto.centroDaCelula(c, l)));
    }
  }
}
