// src/scenes/sala.ts
import { Color, Engine, Scene, Vector, vec, Actor, Text, Font, FontUnit, TextAlign, Keys } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Robo } from "../actors/robos";
import { COLUNAS, LINHAS, montarLabirinto } from "../salas/labirinto";
import { Estado, Direcao } from "../estado";
import { sementeDaSala } from "../salas/mapa";
import { HudLuz } from "../ui/hud-luz";
import { AvisoSala } from "../ui/aviso-sala";
import { Cristal } from "../actors/cristal";
import { chaveDaSala, embaralhar, planejarSala } from "../salas/procedural";

const LARGURA = 320;
const ALTURA = 180;
const MARGEM = 20; // distância segura da parede para a entrada

// Cores
const COR_VERDE = Color.fromHex("#33ff66");
const COR_AMARELO = Color.fromHex("#ffd400");
const COR_VERMELHO = Color.fromHex("#ff2d2d");
const COR_FUNDO = Color.Black;

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
  private salaTinhaRobos = false;
  private estaPausado = false;
  private atoresPausa: Actor[] = [];
  private handlerEsc: ((evt: { key: Keys }) => void) | null = null;

  // A sala é montada no onActivate (que também roda na primeira vez).
  // Montar aqui também criava a sala duas vezes: os robôs da primeira montagem
  // chegavam a atirar antes de serem removidos, deixando balas "fantasmas".
  override onInitialize(_engine: Engine): void {}

  override onActivate(): void {
    // Reseta estado de pausa ao ativar a cena
    this.estaPausado = false;
    Estado.pausado = false;
    
    // Configurar handler de ESC toda vez que a cena é ativada
    this.configurarPausa(this.engine);
    
    // Sempre reconstrói a sala ao ativar (para reiniciar quando volta do menu)
    const engine = this.engine;
    if (engine) {
      // Remove todos os atores existentes
      for (const ator of [...this.actors]) {
        ator.kill();
      }
      // Resetar estado do jogo para valores iniciais
      Estado.coordX = 0;
      Estado.coordY = 0;
      Estado.portaEntrada = null;
      Estado.hp = Estado.hpMax;
      Estado.salasLimpas.clear(); // partida nova: todas as salas voltam a ter robôs
      
      this.montar(engine);
    }
  }

  override onDeactivate(): void {
    // Remove handler de ESC ao sair da cena
    if (this.handlerEsc && this.engine) {
      this.engine.input.keyboard.off("press", this.handlerEsc);
    }
  }

  private configurarPausa(engine: Engine): void {
    this.handlerEsc = (evt: { key: Keys }) => {
      if (evt.key === Keys.Escape) {
        if (this.estaPausado) {
          this.despausar();
        } else {
          this.pausar();
        }
      }
    };
    engine.input.keyboard.on("press", this.handlerEsc);
  }

  private pausar(): void {
    this.estaPausado = true;
    Estado.pausado = true;
    this.mostrarOverlayPausa();
  }

  private despausar(): void {
    this.estaPausado = false;
    Estado.pausado = false;
    this.ocultarOverlayPausa();
  }

  private criarBotao(
    texto: string,
    y: number,
    cor: Color,
    corHover: Color,
    acao: () => void
  ): Actor {
    const cx = LARGURA / 2;
    const botao = new Actor({
      pos: vec(cx, y),
      width: 100,
      height: 20,
      color: cor,
    });
    
    const textoAtor = new Actor({ pos: vec(0, 0) });
    textoAtor.graphics.use(new Text({
      text: texto,
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: 8,
        unit: FontUnit.Px,
        color: COR_FUNDO,
        textAlign: TextAlign.Left,
        bold: true,
        smoothing: false,
      }),
    }));
    botao.addChild(textoAtor);

    botao.on("pointerenter", () => {
      botao.color = corHover;
      document.body.style.cursor = "pointer";
    });
    botao.on("pointerleave", () => {
      botao.color = cor;
      document.body.style.cursor = "default";
    });
    botao.on("pointerdown", acao);

    return botao;
  }

  private mostrarOverlayPausa(): void {
    const cx = LARGURA / 2;
    const cy = ALTURA / 2;

    // Fundo semi-transparente
    const fundo = new Actor({
      pos: vec(cx, cy),
      width: LARGURA,
      height: ALTURA,
      color: Color.fromHex("#000000"),
      opacity: 0.7,
    });
    this.add(fundo);
    this.atoresPausa.push(fundo);

    // Título "PAUSADO"
    const titulo = new Actor({ pos: vec(cx + 35, cy - 40) });
    titulo.graphics.use(new Text({
      text: "PAUSADO",
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: 16,
        unit: FontUnit.Px,
        color: COR_AMARELO,
        textAlign: TextAlign.Center,
        bold: true,
        smoothing: false,
      }),
    }));
    this.add(titulo);
    this.atoresPausa.push(titulo);

    // Botão Continuar
    const botaoContinuar = this.criarBotao(
      "CONTINUAR",
      cy,
      COR_VERDE,
      COR_AMARELO,
      () => this.despausar()
    );
    this.add(botaoContinuar);
    this.atoresPausa.push(botaoContinuar);

    // Botão Menu Inicial
    const botaoMenu = this.criarBotao(
      "MENU INICIAL",
      cy + 30,
      COR_VERMELHO,
      COR_AMARELO,
      () => this.voltarAoMenu()
    );
    this.add(botaoMenu);
    this.atoresPausa.push(botaoMenu);

    // Instrução
    const instrucao = new Actor({ pos: vec(cx, cy + 60) });
    instrucao.graphics.use(new Text({
      text: "ESC - CONTINUAR",
      font: new Font({
        family: "'Press Start 2P', monospace",
        size: 6,
        unit: FontUnit.Px,
        color: COR_AMARELO,
        textAlign: TextAlign.Left,
        smoothing: false,
      }),
    }));
    this.add(instrucao);
    this.atoresPausa.push(instrucao);
  }

  private ocultarOverlayPausa(): void {
    for (const ator of this.atoresPausa) {
      ator.kill();
    }
    this.atoresPausa = [];
  }

  private voltarAoMenu(): void {
    this.ocultarOverlayPausa();
    this.estaPausado = false;
    Estado.pausado = false;
    this.engine.goToScene("menu");
  }

  override onPreUpdate(engine: Engine, _elapsed: number): void {
    // Não executa lógica do jogo quando pausado
    if (this.estaPausado) {
      return;
    }

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

    // Sala limpa: todos os robôs morreram -> não voltam se o jogador retornar
    if (this.salaTinhaRobos && !this.actors.some((a) => a.name === "robo")) {
      this.salaTinhaRobos = false;
      Estado.salasLimpas.add(chaveDaSala(Estado.coordX, Estado.coordY));
      this.add(new AvisoSala("SALA LIMPA", "#33ff66"));
    }

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

    // Plano procedural da sala: tipo, dificuldade e semente (issue #20)
    const plano = planejarSala(Estado.coordX, Estado.coordY);
    const chave = chaveDaSala(Estado.coordX, Estado.coordY);
    const jaLimpa = Estado.salasLimpas.has(chave);

    const labirinto = montarLabirinto(this, engine, { semente: plano.semente, estilo: plano.estilo });

    // Posiciona o jogador na porta de entrada
    const posEntrada = posicaoDeEntrada(Estado.portaEntrada);
    const dirEntrada = direcaoDeEntrada(Estado.portaEntrada);
    const jogador = new Jogador(posEntrada, Estado.hp, dirEntrada);
    this.add(jogador);
    this.add(new HudLuz(jogador)); // habilidade de luz escolhida (issue #19)

    if (plano.nome) this.add(new AvisoSala(plano.nome));

    // Sala de tesouro: cristal de luz no centro (se ainda não foi pego)
    if (plano.temCristal && !jaLimpa) {
      this.add(new Cristal(labirinto.centroDaCelula(2, 1), chave));
    }

    // Robôs: não voltam em sala já limpa
    const quantidadeRobos = jaLimpa ? 0 : plano.quantidadeRobos;
    this.salaTinhaRobos = quantidadeRobos > 0;

    // Nascem em células distantes da entrada, sempre nos mesmos lugares para esta sala
    const livres: [number, number][] = [];
    for (let c = 0; c < COLUNAS; c++) {
      for (let l = 0; l < LINHAS; l++) {
        const centro = labirinto.centroDaCelula(c, l);
        if (centro.distance(posEntrada) > 50) {
          livres.push([c, l]);
        }
      }
    }
    const celulas = embaralhar(livres, plano.semente);

    for (let i = 0; i < quantidadeRobos; i++) {
      const [c, l] = celulas[i % celulas.length];
      // Mais robôs que células: os extras nascem um pouco deslocados do centro
      const deslocamento = i >= celulas.length ? vec(12, 0) : vec(0, 0);
      const robo = new Robo(labirinto.centroDaCelula(c, l).add(deslocamento));
      robo.velocidade = plano.velocidadeRobo;
      robo.recargaTiro = plano.recargaRobo;
      this.add(robo);
    }
  }
}
