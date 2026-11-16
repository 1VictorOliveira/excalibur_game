// src/scenes/sala.ts
import { Engine, KeyEvent, Keys, Scene, Vector, vec } from "excalibur";
import { Jogador } from "../actors/jogador";
import { Robo } from "../actors/robos";
import { Cristal } from "../actors/cristal";
import { COLUNAS, LINHAS, montarLabirinto, ResultadoLabirinto } from "../salas/labirinto";
import { chaveDaSala, embaralhar, PlanoSala, planejarSala } from "../salas/procedural";
import { blocoPilarDa, montarChao } from "../salas/aparencia";
import { Direcao, Estado } from "../estado";
import { HudLuz } from "../ui/hud-luz";
import { HudVida } from "../ui/hud-vida";
import { AvisoSala } from "../ui/aviso-sala";
import { TextoAnimado } from "../ui/texto-animado";
import { MenuPausa } from "../ui/pausa";
import { cortina } from "../efeitos";
import { Resources } from "../resources";
import { ALTURA, LARGURA } from "../config";

const MARGEM = 22; // distância da borda ao entrar

const OPOSTA: Record<Direcao, Direcao> = { norte: "sul", sul: "norte", leste: "oeste", oeste: "leste" };

// Onde o jogador aparece, conforme a porta de entrada (null = sala inicial)
function posicaoDeEntrada(porta: Direcao | null): Vector {
  switch (porta) {
    case "norte": return vec(LARGURA / 2, MARGEM);
    case "sul": return vec(LARGURA / 2, ALTURA - MARGEM);
    case "leste": return vec(LARGURA - MARGEM, ALTURA / 2);
    default: return vec(MARGEM, ALTURA / 2);
  }
}

// Para onde o jogador olha ao entrar
function direcaoDeEntrada(porta: Direcao | null): Vector {
  switch (porta) {
    case "norte": return vec(0, 1);
    case "sul": return vec(0, -1);
    case "leste": return vec(-1, 0);
    default: return vec(1, 0);
  }
}

export class Sala extends Scene {
  private transicaoPendente: Direcao | null = null;
  private salaTinhaRobos = false;
  private avisoNome: TextoAnimado | null = null;
  private pausado = false;
  private pausa = new MenuPausa(this, () => this.despausar(), () => this.voltarAoMenu());

  private aoApertar = (evt: KeyEvent): void => {
    if (evt.key !== Keys.Escape) return;
    if (this.pausado) this.despausar();
    else this.pausar();
  };

  // A sala é montada no onActivate (montar também aqui duplicava os robôs)
  override onInitialize(): void {}

  override onActivate(): void {
    this.engine.input.keyboard.on("press", this.aoApertar);
    this.limparPausa();

    // Partida nova
    for (const ator of [...this.actors]) ator.kill();
    Estado.coordX = 0;
    Estado.coordY = 0;
    Estado.portaEntrada = null;
    Estado.hp = Estado.hpMax;
    Estado.salasLimpas.clear();
    this.montar(this.engine);
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
    this.limparPausa();
  }

  override onPreUpdate(engine: Engine): void {
    if (this.pausado) return;

    if (this.transicaoPendente) {
      const direcao = this.transicaoPendente;
      this.transicaoPendente = null;
      this.trocarDeSala(direcao, engine);
      return;
    }

    const jogador = this.jogador();
    if (!jogador) return;

    if (this.salaTinhaRobos && !this.actors.some((a) => a.name === "robo")) {
      this.salaTinhaRobos = false;
      Estado.salasLimpas.add(chaveDaSala(Estado.coordX, Estado.coordY));
      this.mostrarSalaPurificada(engine);
    }

    const saida = this.saidaDo(jogador);
    if (saida) {
      Estado.hp = jogador.hp;
      this.transicaoPendente = saida;
    }
  }

  // ---------- Pausa ----------

  private pausar(): void {
    const jogador = this.jogador();
    if (!jogador || jogador.estaMorto) return;
    this.pausado = true;
    Estado.pausado = true;
    this.engine.timescale = 0; // congela balas, animações e timers
    this.pausa.mostrar();
  }

  private despausar(): void {
    this.limparPausa();
  }

  private limparPausa(): void {
    this.pausa.ocultar();
    this.pausado = false;
    Estado.pausado = false;
    this.engine.timescale = 1;
  }

  private voltarAoMenu(): void {
    this.limparPausa();
    this.engine.goToScene("menu");
  }

  // ---------- Troca de sala ----------

  private jogador(): Jogador | undefined {
    return this.actors.find((a) => a.name === "jogador") as Jogador | undefined;
  }

  // Só dá para sair da tela pelas portas
  private saidaDo(jogador: Jogador): Direcao | null {
    if (jogador.pos.x < 0) return "oeste";
    if (jogador.pos.x > LARGURA) return "leste";
    if (jogador.pos.y < 0) return "norte";
    if (jogador.pos.y > ALTURA) return "sul";
    return null;
  }

  private trocarDeSala(direcao: Direcao, engine: Engine): void {
    switch (direcao) {
      case "norte": Estado.coordY--; break;
      case "sul": Estado.coordY++; break;
      case "leste": Estado.coordX++; break;
      case "oeste": Estado.coordX--; break;
    }
    Estado.portaEntrada = OPOSTA[direcao];
    for (const ator of [...this.actors]) ator.kill();
    this.montar(engine);
  }

  // ---------- Montagem ----------

  private montar(engine: Engine): void {
    const plano = planejarSala(Estado.coordX, Estado.coordY);
    const chave = chaveDaSala(Estado.coordX, Estado.coordY);
    const jaLimpa = Estado.salasLimpas.has(chave);
    this.avisoNome = null;

    montarChao(this, plano.tipo);
    const labirinto = montarLabirinto(this, engine, {
      semente: plano.semente,
      estilo: plano.estilo,
      blocoPilar: blocoPilarDa(plano.tipo),
    });

    const entrada = posicaoDeEntrada(Estado.portaEntrada);
    const jogador = new Jogador(entrada, Estado.hp, direcaoDeEntrada(Estado.portaEntrada));
    this.add(jogador);
    jogador.ficarInvencivel(1000);
    this.add(new HudLuz(jogador));
    this.add(new HudVida(jogador));

    this.mostrarNome(plano);

    if (plano.temCristal && !jaLimpa) this.add(new Cristal(labirinto.centroDaCelula(2, 1), chave));

    const quantidade = jaLimpa ? 0 : plano.quantidadeRobos;
    this.salaTinhaRobos = quantidade > 0;
    this.criarRobos(plano, labirinto, entrada, quantidade);

    cortina(this, LARGURA, ALTURA);
  }

  private mostrarNome(plano: PlanoSala): void {
    if (plano.tipo === "inicio") {
      this.avisoNome = new TextoAnimado(Resources.SalaSantuario, 181, 22, vec(LARGURA / 2, 22), { duracao: 1400 });
      this.add(this.avisoNome);
    } else if (plano.nome) {
      this.add(new AvisoSala(plano.nome));
    }
  }

  // Robôs nascem em células longe da entrada, sempre nos mesmos lugares para a mesma sala
  private criarRobos(plano: PlanoSala, labirinto: ResultadoLabirinto, entrada: Vector, quantidade: number): void {
    const livres: [number, number][] = [];
    for (let c = 0; c < COLUNAS; c++) {
      for (let l = 0; l < LINHAS; l++) {
        if (labirinto.centroDaCelula(c, l).distance(entrada) > 50) livres.push([c, l]);
      }
    }
    const celulas = embaralhar(livres, plano.semente);
    for (let i = 0; i < quantidade; i++) {
      const [c, l] = celulas[i % celulas.length];
      const deslocamento = i >= celulas.length ? vec(12, 0) : vec(0, 0); // excedentes ao lado do centro
      const robo = new Robo(labirinto.centroDaCelula(c, l).add(deslocamento), labirinto);
      robo.velocidade = plano.velocidadeRobo;
      robo.recargaTiro = plano.recargaRobo;
      this.add(robo);
    }
  }

  // Se o nome da sala ainda estiver na tela, ele sai antes
  private mostrarSalaPurificada(engine: Engine): void {
    const nomeNaTela = this.avisoNome && !this.avisoNome.isKilled();
    if (nomeNaTela) this.avisoNome!.sair();
    const aviso = new TextoAnimado(Resources.SalaPurificada, 159, 22, vec(LARGURA / 2, 22), { duracao: 1400 });
    if (nomeNaTela) engine.clock.schedule(() => this.add(aviso), 400);
    else this.add(aviso);
  }
}
