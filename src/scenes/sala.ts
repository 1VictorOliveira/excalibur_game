// src/scenes/sala.ts
import { Color, CollisionType, Engine, Scene, Vector, vec, Actor, Text, Keys } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Diabrete } from "../enemies/Diabrete";
import { AnjoCaido } from "../enemies/AnjoCaido";
import { Arquidemonio } from "../enemies/Arquidemonio";
import { COLUNAS, LINHAS, montarLabirinto } from "../salas/labirinto";
import { Estado, Direcao } from "../estado";
import { sementeDaSala } from "../salas/mapa";
import { HudLuz } from "../ui/hud-luz";
import { AvisoSala } from "../ui/aviso-sala";
import { TextoAnimado } from "../ui/texto-animado";
import { Cristal } from "../actors/cristal";
import { chaveDaSala, embaralhar, planejarSala } from "../salas/procedural";
import { HudVida } from "../ui/hud-vida";
import { fontePixel } from "../ui/fonte";
import { cortina } from "../efeitos";
import { Resources } from "../resources";

const LARGURA = 320;
const ALTURA = 180;
const MARGEM = 20; // distância segura da parede para a entrada

// Cores
const COR_VERDE = Color.fromHex("#33ff66");
const COR_AMARELO = Color.fromHex("#ffd400");
const COR_VERMELHO = Color.fromHex("#ff2d2d");
const COR_FUNDO = Color.Black;

const TIPOS_INIMIGOS = {
  diabrete: Diabrete,
  "anjo-caido": AnjoCaido,
  arquidemonio: Arquidemonio,
};

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
  private salaTinhaInimigos = false;
  private avisoNome: TextoAnimado | null = null; // nome da sala na tela (sprite do Figma)
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
    this.engine.timescale = 1;
    
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
      Estado.salasLimpas.clear(); // partida nova: todas as salas voltam a ter inimigos
      
      this.montar(engine);
    }
  }

  override onDeactivate(): void {
    // Remove handler de ESC ao sair da cena
    if (this.handlerEsc && this.engine) {
      this.engine.input.keyboard.off("press", this.handlerEsc);
    }
    // Nunca deixa outra cena (menu, game over) herdar o tempo parado da pausa
    this.ocultarOverlayPausa();
    this.estaPausado = false;
    Estado.pausado = false;
    this.engine.timescale = 1;
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
    // Sem pausa durante a animação de morte (o game over chega logo em seguida)
    const jogador = this.actors.find((a) => a.name === "jogador") as Jogador | undefined;
    if (!jogador || jogador.estaMorto) return;
    this.estaPausado = true;
    Estado.pausado = true;
    // Congela o TEMPO do jogo inteiro: balas, ações, partículas e timers param juntos.
    // Antes só jogador e inimigos paravam; as balas continuavam voando.
    this.engine.timescale = 0;
    this.mostrarOverlayPausa();
  }

  private despausar(): void {
    this.estaPausado = false;
    Estado.pausado = false;
    this.engine.timescale = 1;
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
      width: 110,
      height: 20,
      color: cor,
      z: 501,
      // Sem colisão física: antes o botão (e o fundo da pausa) "comiam" as balas
      collisionType: CollisionType.PreventCollision,
    });

    const textoAtor = new Actor({ pos: vec(0, 0) });
    textoAtor.graphics.use(new Text({ text: texto, font: fontePixel(8, COR_FUNDO) }));
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
      z: 500, // por cima do HUD
      // Sem isso, o fundo da pausa era uma "parede" do tamanho da tela e apagava todas as balas
      collisionType: CollisionType.PreventCollision,
    });
    this.add(fundo);
    this.atoresPausa.push(fundo);

    // Título "PAUSADO"
    const titulo = new Actor({ pos: vec(cx, cy - 40), z: 501 });
    titulo.graphics.use(new Text({ text: "PAUSADO", font: fontePixel(16, COR_AMARELO) }));
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
    const instrucao = new Actor({ pos: vec(cx, cy + 60), z: 501 });
    instrucao.graphics.use(new Text({ text: "ESC - CONTINUAR", font: fontePixel(8, COR_AMARELO) }));
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
    this.engine.timescale = 1;
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

    // Sala limpa: todos os inimigos morreram -> não voltam se o jogador retornar
    const temInimigos = this.actors.some(
      (a) => a.name === "robo" || a instanceof Diabrete || a instanceof AnjoCaido || a instanceof Arquidemonio,
    );
    if (this.salaTinhaInimigos && !temInimigos) {
      this.salaTinhaInimigos = false;
      Estado.salasLimpas.add(chaveDaSala(Estado.coordX, Estado.coordY));
      // "SALA PURIFICADA" do Figma: abre numa linha de luz, brilha e vira poeira dourada.
      // Se o nome da sala ainda estiver na tela, ele sai primeiro (senão os dois se sobrepõem).
      const nomeNaTela = this.avisoNome && !this.avisoNome.isKilled();
      if (nomeNaTela) this.avisoNome!.sair();
      const purificada = new TextoAnimado(Resources.SalaPurificada, 159, 22, vec(LARGURA / 2, 22), { duracao: 1400 });
      if (nomeNaTela) engine.clock.schedule(() => this.add(purificada), 400);
      else this.add(purificada);
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
    this.avisoNome = null;
    const chave = chaveDaSala(Estado.coordX, Estado.coordY);
    const jaLimpa = Estado.salasLimpas.has(chave);

    const labirinto = montarLabirinto(this, engine, { semente: plano.semente, estilo: plano.estilo });

    // Posiciona o jogador na porta de entrada
    const posEntrada = posicaoDeEntrada(Estado.portaEntrada);
    const dirEntrada = direcaoDeEntrada(Estado.portaEntrada);
    const jogador = new Jogador(posEntrada, Estado.hp, dirEntrada);
    this.add(jogador);
    jogador.ficarInvencivel(1000); // 1 s de proteção ao entrar: ninguém morre no 1º quadro da sala
    this.add(new HudLuz(jogador)); // habilidade de luz escolhida (issue #19)
    this.add(new HudVida(jogador));

    if (plano.tipo === "inicio") {
      // Sala inicial: nome desenhado no Figma
      this.avisoNome = new TextoAnimado(Resources.SalaSantuario, 181, 22, vec(LARGURA / 2, 22), { duracao: 1400 });
      this.add(this.avisoNome);
    } else if (plano.nome) {
      this.add(new AvisoSala(plano.nome)); // os outros nomes ainda são texto (sprites ainda não feitos)
    }

    // Sala de tesouro: cristal de luz no centro (se ainda não foi pego)
    if (plano.temCristal && !jaLimpa) {
      this.add(new Cristal(labirinto.centroDaCelula(2, 1), chave));
    }

    // Inimigos: não voltam em sala já limpa
    const quantidadeDiabretes = jaLimpa ? 0 : plano.quantidadeDiabretes;
    const inimigos = jaLimpa ? [] : plano.inimigos;
    this.salaTinhaInimigos = quantidadeDiabretes + inimigos.length > 0;

    // Nascem em células distantes da entrada, sempre nos mesmos lugares para esta sala
    const ocupadas = new Set(inimigos.map(({ celula }) => `${celula[0]},${celula[1]}`));
    const livres: [number, number][] = [];
    for (let c = 0; c < COLUNAS; c++) {
      for (let l = 0; l < LINHAS; l++) {
        const centro = labirinto.centroDaCelula(c, l);
        if (centro.distance(posEntrada) > 50 && !ocupadas.has(`${c},${l}`)) {
          livres.push([c, l]);
        }
      }
    }
    const celulas = embaralhar(livres, plano.semente);

    for (let i = 0; i < quantidadeDiabretes; i++) {
      const [c, l] = celulas[i % celulas.length];
      // Mais inimigos que células: os extras nascem um pouco deslocados do centro
      const deslocamento = i >= celulas.length ? vec(12, 0) : vec(0, 0);
      this.add(new Diabrete(labirinto.centroDaCelula(c, l).add(deslocamento)));
    }

    for (const marcador of inimigos) {
      const Inimigo = TIPOS_INIMIGOS[marcador.tipo];
      this.add(new Inimigo(labirinto.centroDaCelula(...marcador.celula)));
    }

    // Some uma tela preta rápida: a troca de sala deixa de ser um corte seco
    cortina(this, LARGURA, ALTURA);
  }
}
