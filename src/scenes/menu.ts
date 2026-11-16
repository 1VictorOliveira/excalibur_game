// src/scenes/menu.ts
import {
  Actor,
  Animation,
  Color,
  CollisionType,
  Engine,
  GraphicsGroup,
  ImageSource,
  KeyEvent,
  Keys,
  Rectangle,
  Scene,
  SpriteSheet,
  vec,
} from "excalibur";
import { Resources } from "../resources";
import { montarFundo } from "../cenario/fundo";
import { LogoRefratado } from "../ui/logo";
import { BotaoSprite } from "../ui/botao-sprite";
import { cortina, faisca } from "../efeitos";

const LARGURA = 320;
const ALTURA = 180;

// Posições verticais
const Y_LOGO = 44;
const Y_LUZ = 94;
const Y_PRIMEIRA_OPCAO = 128;
const ESPACO_OPCOES = 22;

// Pílula de luz que marca a opção escolhida
const LARGURA_PILULA = 112;
const ALTURA_PILULA = 18;

type Opcao = {
  y: number;
  botao: BotaoSprite; // JOGAR / OPÇÕES desenhados no Figma
  acao: () => void;
};

/*
  Tela inicial do Refract.
  - Fundo do espaço animado, logo com efeito de prisma e a luz flutuando.
  - Só duas opções: JOGAR e OPÇÕES (botões desenhados no Figma: normal, escolhido, apertado).
  - A escolha é marcada por uma "pílula de luz" que desliza como uma MOLA:
    passa um pouco do ponto e volta, e estica enquanto se move. Por isso parece orgânica.
  - Teclado (W/S ou setas + ENTER/ESPAÇO) e mouse (passar por cima + clicar).
*/
export class Menu extends Scene {
  private opcoes: Opcao[] = [];
  private escolhida = 0;
  private confirmando = false;
  private tempo = 0;

  // Mola da pílula: posição, velocidade e alvo
  private pilula!: Actor;
  private preenchimento!: Rectangle; // miolo translúcido
  private contorno!: Rectangle; // borda dourada
  private halo!: Rectangle; // brilho fraco em volta
  private intensidade = 0.08; // opacidade atual do miolo (anima)
  private pilulaY = Y_PRIMEIRA_OPCAO;
  private pilulaVel = 0;
  private soco = 0; // "estufada" rápida ao confirmar (decai sozinha)

  private luz!: Actor;
  private proximaFaisca = 0; // tempo até a luz soltar a próxima faísca

  private aoApertar = (evt: KeyEvent): void => {
    if (this.confirmando) return;
    if (evt.key === Keys.Up || evt.key === Keys.W) this.selecionar(this.escolhida - 1);
    if (evt.key === Keys.Down || evt.key === Keys.S) this.selecionar(this.escolhida + 1);
    if (evt.key === Keys.Enter || evt.key === Keys.Space) this.confirmar();
  };

  override onInitialize(engine: Engine): void {
    montarFundo(this, engine);
    this.add(new LogoRefratado(LARGURA / 2, Y_LOGO));
    this.criarLuz();
    this.criarPilula();

    this.criarOpcao(Resources.BotaoJogar, 0, () => this.engine.goToScene("sala"));
    this.criarOpcao(Resources.BotaoOpcoes, 1, () => this.engine.goToScene("configuracoes"));

    this.atualizarBotoes();
  }

  override onActivate(): void {
    this.confirmando = false;
    this.opcoes.forEach((o, i) => {
      o.botao.escolher(false); // volta do apertado para o estado certo
      o.botao.escolher(i === this.escolhida);
    });
    this.engine.input.keyboard.on("press", this.aoApertar);
    cortina(this, LARGURA, ALTURA, 350); // entra clareando, sem corte seco
  }

  override onDeactivate(): void {
    this.engine.input.keyboard.off("press", this.aoApertar);
    document.body.style.cursor = "default";
  }

  // ---------- Montagem ----------

  // A luz (personagem) flutuando entre o logo e as opções.
  // As faíscas que ela solta são o sprite do Figma (ver onPreUpdate), não partículas de código.
  private criarLuz(): void {
    this.luz = new Actor({ pos: vec(LARGURA / 2, Y_LUZ), z: 40 });
    // A mesma luz do jogo (desenho do Figma), brilhando parada
    const folha = SpriteSheet.fromImageSource({
      image: Resources.LuzParada,
      grid: { rows: 1, columns: 4, spriteWidth: 32, spriteHeight: 32 },
    });
    this.luz.graphics.use(Animation.fromSpriteSheet(folha, [0, 1, 2, 3], 160));
    this.add(this.luz);
  }

  private criarPilula(): void {
    // Três camadas: halo fraco por fora, miolo translúcido e borda dourada nítida
    this.halo = new Rectangle({ width: LARGURA_PILULA + 4, height: ALTURA_PILULA + 4, color: comAlfa("#fff4b0", 0.06) });
    this.preenchimento = new Rectangle({ width: LARGURA_PILULA, height: ALTURA_PILULA, color: comAlfa("#fff4b0", this.intensidade) });
    this.contorno = new Rectangle({
      width: LARGURA_PILULA,
      height: ALTURA_PILULA,
      color: Color.Transparent,
      strokeColor: comAlfa("#ffc93c", 0.5),
      lineWidth: 1,
    });
    this.pilula = new Actor({
      pos: vec(LARGURA / 2, this.pilulaY),
      z: 50,
      collisionType: CollisionType.PreventCollision,
    });
    this.pilula.graphics.use(
      new GraphicsGroup({
        members: [
          { graphic: this.halo, offset: vec(0, 0) },
          { graphic: this.preenchimento, offset: vec(2, 2) },
          { graphic: this.contorno, offset: vec(2, 2) },
        ],
      }),
    );
    this.add(this.pilula);
  }

  private criarOpcao(imagem: ImageSource, indice: number, acao: () => void): void {
    const y = Y_PRIMEIRA_OPCAO + indice * ESPACO_OPCOES;
    const botao = new BotaoSprite(imagem, vec(LARGURA / 2, y));
    this.add(botao);

    // Área do mouse um pouco maior que o texto (sem colisão física)
    const area = new Actor({
      pos: vec(LARGURA / 2, y),
      width: LARGURA_PILULA,
      height: ESPACO_OPCOES - 2,
      collisionType: CollisionType.PreventCollision,
    });
    area.on("pointerenter", () => {
      document.body.style.cursor = "pointer";
      if (!this.confirmando) this.selecionar(indice);
    });
    area.on("pointerleave", () => (document.body.style.cursor = "default"));
    area.on("pointerdown", () => {
      if (this.confirmando) return;
      this.selecionar(indice);
      this.confirmar();
    });
    this.add(area);

    this.opcoes.push({ y, botao, acao });
  }

  // ---------- Interação ----------

  private selecionar(indice: number): void {
    const total = this.opcoes.length;
    const novo = ((indice % total) + total) % total; // dá a volta: do último vai ao primeiro
    if (novo === this.escolhida) return;
    this.escolhida = novo;
    this.atualizarBotoes();
  }

  private atualizarBotoes(): void {
    this.opcoes.forEach((o, i) => o.botao.escolher(i === this.escolhida));
  }

  private confirmar(): void {
    this.confirmando = true;
    const opcao = this.opcoes[this.escolhida];

    // Resposta imediata ao toque: a pílula estufa e acende, e o botão toca o "apertado" do Figma
    this.soco = 1;
    this.intensidade = 0.6;
    opcao.botao.apertar();

    // Depois a tela escurece e troca de cena
    const tela = new Actor({ pos: vec(0, 0), anchor: vec(0, 0), z: 1000, collisionType: CollisionType.PreventCollision });
    tela.graphics.use(new Rectangle({ width: LARGURA, height: ALTURA, color: Color.Black }));
    tela.graphics.opacity = 0;
    this.add(tela);
    tela.actions
      .delay(220)
      .fade(1, 260)
      .callMethod(() => {
        tela.kill();
        opcao.acao();
      });
  }

  // ---------- Animação ----------

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    const dt = Math.min(elapsed, 50) / 1000;
    this.tempo += dt;

    // A luz flutua devagar e, de vez em quando, solta uma faísca (sprite do Figma) em volta
    this.luz.pos.y = Y_LUZ + Math.sin(this.tempo * 2) * 3;
    this.proximaFaisca -= dt;
    if (this.proximaFaisca <= 0) {
      this.proximaFaisca = 0.35 + Math.random() * 0.45;
      const angulo = Math.random() * Math.PI * 2;
      const distancia = 14 + Math.random() * 6; // fora do brilho da própria luz
      const ponto = vec(
        Math.round(this.luz.pos.x + Math.cos(angulo) * distancia),
        Math.round(this.luz.pos.y + Math.sin(angulo) * distancia),
      );
      faisca(this, ponto, 1, 0, 39);
    }

    // Mola: acelera em direção ao alvo e é freada; com pouco freio ela passa do ponto e volta
    const alvo = this.opcoes[this.escolhida]?.y ?? Y_PRIMEIRA_OPCAO;
    const rigidez = 260;
    const freio = 15; // menos freio = balança mais (20 já quase não passava do ponto)
    this.pilulaVel += (rigidez * (alvo - this.pilulaY) - freio * this.pilulaVel) * dt;
    this.pilulaY += this.pilulaVel * dt;

    // Estica na vertical quando anda rápido; estufa ao confirmar; "respira" parada
    const esticada = Math.min(6, Math.abs(this.pilulaVel) * 0.035);
    this.soco = Math.max(0, this.soco - dt * 4);
    const respiro = Math.sin(this.tempo * 3) * 1;
    const largura = Math.round(LARGURA_PILULA - esticada * 2 + this.soco * 14 + respiro);
    const altura = Math.round(ALTURA_PILULA + esticada + this.soco * 4);
    if (this.preenchimento.width !== largura || this.preenchimento.height !== altura) {
      this.preenchimento.width = this.contorno.width = largura;
      this.preenchimento.height = this.contorno.height = altura;
      this.halo.width = largura + 4;
      this.halo.height = altura + 4;
    }
    this.pilula.pos.y = Math.round(this.pilulaY);

    // Brilho do miolo: pulsa parado; volta ao normal depois do flash da confirmação
    const brilhoAlvo = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(this.tempo * 3));
    this.intensidade += (brilhoAlvo - this.intensidade) * Math.min(1, dt * 6);
    const alfa = Math.round(this.intensidade * 50) / 50; // só redesenha quando muda de verdade
    if (Math.abs(this.preenchimento.color.a - alfa) > 0.001) this.preenchimento.color = comAlfa("#fff4b0", alfa);

    // A opção escolhida acompanha o balanço da mola da pílula
    this.opcoes.forEach((o, i) => {
      const destino = i === this.escolhida ? o.y + Math.round(this.pilulaY - alvo) : o.y;
      o.botao.pos.y = destino;
    });
  }
}

function comAlfa(hex: string, alfa: number): Color {
  const cor = Color.fromHex(hex);
  cor.a = alfa;
  return cor;
}
