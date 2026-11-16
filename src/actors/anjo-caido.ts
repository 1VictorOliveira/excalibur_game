// src/actors/anjo-caido.ts
import { Actor, Collider, CollisionType, Color, Engine, Vector, vec } from "excalibur";
import { Jogador } from "./jogador";
import { Danificavel, podeLevarDano } from "../dano";
import { Grupos } from "../grupos";
import { Estado } from "../estado";

// Callbacks para comunicação com outros sistemas (UI, áudio, efeitos)
export interface AvisoLancaPayload {
  posicaoAlvo: Vector;
  duracao: number;
}

export interface LancaCaiuPayload {
  posicaoAlvo: Vector;
}

// Configurações do Anjo Caído (valores padrão, ajustáveis)
export interface AnjoCaidoConfig {
  velocidade?: number;
  hp?: number;
  raioAoE?: number;
  danoLanca?: number;
  tempoRecarga?: number; // ms entre ataques
  tempoTelegrafo?: number; // segundos
  predicaoTempo?: number; // segundos para calcular posição futura
}

const CONFIG_PADRAO: Required<AnjoCaidoConfig> = {
  velocidade: 30, // mais lento que robôs (25) para equilibrar a mecânica de telégrafo
  hp: 4, // aguenta mais tiros que robôs (2)
  raioAoE: 20, // raio da área de impacto da lança
  danoLanca: 2, // dano alto (jogador tem 3 HP)
  tempoRecarga: 3000, // 3 segundos entre ataques
  tempoTelegrafo: 1.2, // 1,2 segundos de aviso
  predicaoTempo: 1.0, // calcula posição 1 segundo no futuro
};

export class AnjoCaido extends Actor implements Danificavel {
  readonly config: Required<AnjoCaidoConfig>;
  velocidade: number;
  hp: number;
  
  private tempoRecargaAtual = 0;
  private emTelégrafo = false;
  private tempoTelégrafoRestante = 0;
  private posicaoAlvo: Vector | null = null;
  private destruido = false;

  // Callbacks para comunicação desacoplada
  public onAvisoLancaIniciado?: (payload: AvisoLancaPayload) => void;
  public onLancaCaiu?: (payload: LancaCaiuPayload) => void;

  constructor(pos: Vector, config?: AnjoCaidoConfig) {
    super({
      name: "anjo-caido",
      pos,
      width: 12, // placeholder visual
      height: 16,
      color: Color.fromHex("#8a2be2"), // roxo (placeholder visual)
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.robo, // usa o mesmo grupo para colidir com paredes, outros robôs, tiros
    });

    this.config = { ...CONFIG_PADRAO, ...config };
    this.velocidade = this.config.velocidade;
    this.hp = this.config.hp;
    this.tempoRecargaAtual = 1500; // primeiro ataque mais rápido (1.5s)
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    // Não executa lógica quando pausado
    if (Estado.pausado) {
      this.vel = vec(0, 0);
      return;
    }

    // Se está em meio ao telégrafo, apenas atualiza o timer
    if (this.emTelégrafo) {
      this.atualizarTelégrafo(elapsed);
      return;
    }

    // Busca o jogador na cena
    const jogador = this.scene?.actors.find(a => a.name === "jogador") as Jogador | undefined;
    if (!jogador) {
      this.vel = vec(0, 0); // Para quando o jogador morre
      return;
    }

    // Movimento: persegue o jogador (mas mantém distância para não sobrepor)
    const direcao = jogador.pos.sub(this.pos);
    const distancia = direcao.size;

    if (distancia > 20) {
      const direcaoNormalizada = direcao.normalize();
      this.vel = direcaoNormalizada.scale(this.velocidade);
    } else {
      this.vel = vec(0, 0);
    }

    // Lógica de ataque: verifica recarga e inicia telégrafo
    this.tempoRecargaAtual -= elapsed;
    if (this.tempoRecargaAtual <= 0) {
      this.iniciarTelégrafo(jogador);
    }
  }

  /**
   * Inicia o telégrafo: calcula posição futura do jogador e prepara o ataque.
   */
  private iniciarTelégrafo(jogador: Jogador): void {
    // Cálculo de predição: PosicaoAlvo = PosicaoJogador + (VelocidadeJogador * tempo)
    const posicaoJogador = jogador.pos;
    const velocidadeJogador = jogador.vel;
    this.posicaoAlvo = posicaoJogador.add(velocidadeJogador.scale(this.config.predicaoTempo));

    console.log(`[Anjo Caído] Iniciando telégrafo. Alvo: (${this.posicaoAlvo.x.toFixed(1)}, ${this.posicaoAlvo.y.toFixed(1)})`);

    // Inicia o telégrafo
    this.emTelégrafo = true;
    this.tempoTelégrafoRestante = this.config.tempoTelegrafo;

    // Para o Anjo durante o telégrafo (momento de concentração)
    this.vel = vec(0, 0);

    // Dispara evento de aviso para outros sistemas (UI, áudio, etc.)
    this.onAvisoLancaIniciado?.({
      posicaoAlvo: this.posicaoAlvo,
      duracao: this.config.tempoTelegrafo,
    });
  }

  /**
   * Atualiza o timer do telégrafo e executa o impacto quando termina.
   */
  private atualizarTelégrafo(elapsed: number): void {
    this.tempoTelégrafoRestante -= elapsed / 1000; // converter ms para segundos

    if (this.tempoTelégrafoRestante <= 0 && this.posicaoAlvo) {
      this.executarImpacto(this.posicaoAlvo);
      this.emTelégrafo = false;
      this.tempoRecargaAtual = this.config.tempoRecarga;
      this.posicaoAlvo = null;
    }
  }

  /**
   * Realiza checagem de colisão em área (AoE) e aplica dano se o jogador estiver na área.
   */
  private executarImpacto(posicaoAlvo: Vector): void {
    console.log(`[Anjo Caído] Lança caiu em (${posicaoAlvo.x.toFixed(1)}, ${posicaoAlvo.y.toFixed(1)})`);
    
    // Dispara evento de impacto
    this.onLancaCaiu?.({ posicaoAlvo });

    // Busca o jogador na cena
    const jogador = this.scene?.actors.find(a => a.name === "jogador") as Jogador | undefined;
    if (!jogador) {
      console.log("[Anjo Caído] Jogador não encontrado");
      return;
    }

    // Checa se o jogador está dentro do raio da AoE
    const distancia = jogador.pos.distance(posicaoAlvo);
    console.log(`[Anjo Caído] Distância do jogador ao alvo: ${distancia.toFixed(1)}px (raio: ${this.config.raioAoE}px)`);
    
    if (distancia <= this.config.raioAoE) {
      console.log("[Anjo Caído] ACERTOU! Aplicando dano");
      // Aplica dano se o jogador puder levar dano
      if (podeLevarDano(jogador)) {
        jogador.levarDano(this.config.danoLanca);
      }
    } else {
      console.log("[Anjo Caído] Errou!");
    }
  }

  override onCollisionStart(_self: Collider, outro: Collider): void {
    // Se colidir com outro robô, ambos se destroem (padrão do Berzerk)
    if (outro.owner instanceof AnjoCaido) {
      outro.owner.destruir();
      this.destruir();
    }
  }

  /**
   * Aplica dano ao Anjo Caído.
   */
  levarDano(quantidade: number): void {
    if (this.destruido) return;

    this.hp -= quantidade;
    if (this.hp <= 0) {
      this.destruir();
    } else {
      // Pisca quando leva dano mas não morre
      this.actions.blink(80, 80, 3);
    }
  }

  /**
   * Destrói o Anjo Caído (remove da cena).
   */
  destruir(): void {
    if (this.destruido) return;
    console.log(`[Anjo Caído] Destruido em (${this.pos.x}, ${this.pos.y})`);
    this.destruido = true;
    this.kill();
  }

  /**
   * Cancela o telégrafo atual (útil se o Anjo for atordoado ou morto durante o aviso).
   */
  cancelarTelégrafo(): void {
    this.emTelégrafo = false;
    this.tempoTelégrafoRestante = 0;
    this.posicaoAlvo = null;
    this.tempoRecargaAtual = this.config.tempoRecarga;
  }
}
