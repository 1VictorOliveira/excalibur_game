// src/actors/jogador.ts
import { Actor, Animation, CollisionType, Engine, Keys, Vector, vec } from "excalibur";
import { Danificavel } from "../dano";
import { Grupos } from "../grupos";
import { Estado } from "../estado";
import { Foco, Habilidade, Prisma, Reflexao } from "../luz/habilidades";
import { VisualLuz } from "./visual-luz";

export class Jogador extends Actor implements Danificavel {
  velocidade = 90; // pixels por segundo
  direcao = vec(1, 0); // última direção andada
  hpMax = 3;
  hp = this.hpMax;
  // Habilidades de luz (issue #19). Teclas 1, 2, 3 escolhem; Q troca para a próxima.
  habilidades: Habilidade[] = [new Reflexao(), new Foco(), new Prisma()];
  indiceHabilidade = Estado.habilidade; // continua a mesma ao trocar de sala
  private tempoInvencibilidade = 0;
  private invencivel = false;
  private morto = false;
  // Visual: a luz desenhada no Figma (antes era um retângulo verde)
  private visual = new VisualLuz();
  private tocandoDano = false;

  constructor(pos: Vector, hp: number = 3, direcaoInicial: Vector = vec(1, 0)) {
    super({
      name: "jogador",
      pos,
      width: 10,
      height: 14,
      collisionType: CollisionType.Active,
      collisionGroup: Grupos.jogador,
    });
    this.hp = hp;
    this.direcao = direcaoInicial;
  }

  override onInitialize(): void {
    this.graphics.use(this.visual.parada);
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    // Morrendo: fica parado enquanto a animação de morte toca
    if (this.morto) {
      this.vel = vec(0, 0);
      return;
    }

    // Não executa lógica quando pausado
    if (Estado.pausado) {
      this.vel = vec(0, 0);
      return;
    }

    // Atualiza invencibilidade
    if (this.invencivel) {
      this.tempoInvencibilidade -= elapsed;
      if (this.tempoInvencibilidade <= 0) {
        this.invencivel = false;
      }
    }

    const k = engine.input.keyboard;

    // --- Movimento: WASD (as setas agora são do tiro) ---
    const mov = vec(0, 0);
    if (k.isHeld(Keys.A)) mov.x -= 1;
    if (k.isHeld(Keys.D)) mov.x += 1;
    if (k.isHeld(Keys.W)) mov.y -= 1;
    if (k.isHeld(Keys.S)) mov.y += 1;

    if (mov.size > 0) {
      this.direcao = mov.normalize();
      this.vel = this.direcao.scale(this.velocidade);
    } else {
      this.vel = vec(0, 0);
    }
    this.atualizarVisual(mov);

    // --- Tiro: setas em 8 direções (duas setas juntas = diagonal) ---
    const mira = vec(0, 0);
    if (k.isHeld(Keys.Left)) mira.x -= 1;
    if (k.isHeld(Keys.Right)) mira.x += 1;
    if (k.isHeld(Keys.Up)) mira.y -= 1;
    if (k.isHeld(Keys.Down)) mira.y += 1;

    // Espaço atira para onde o jogador está andando (estilo Berzerk original)
    if (mira.size === 0 && k.isHeld(Keys.Space)) mira.setTo(this.direcao.x, this.direcao.y);

    // --- Troca de habilidade ---
    if (k.wasPressed(Keys.Digit1) || k.wasPressed(Keys.Num1)) this.escolherHabilidade(0);
    if (k.wasPressed(Keys.Digit2) || k.wasPressed(Keys.Num2)) this.escolherHabilidade(1);
    if (k.wasPressed(Keys.Digit3) || k.wasPressed(Keys.Num3)) this.escolherHabilidade(2);
    if (k.wasPressed(Keys.Q)) this.escolherHabilidade((this.indiceHabilidade + 1) % this.habilidades.length);

    // A habilidade escolhida decide o que fazer com a mira
    this.habilidadeAtual.atualizar(this, mira, elapsed);
  }

  // Troca a animação conforme o movimento (o dano tem prioridade até terminar)
  private atualizarVisual(mov: Vector): void {
    if (this.tocandoDano) {
      if (!this.visual.dano.done) return;
      this.tocandoDano = false;
    }
    const desejada: Animation = mov.size > 0 ? this.visual.andando(mov) : this.visual.parada;
    if (this.graphics.current !== desejada) this.graphics.use(desejada);
  }

  get habilidadeAtual(): Habilidade {
    return this.habilidades[this.indiceHabilidade];
  }

  escolherHabilidade(indice: number): void {
    if (indice === this.indiceHabilidade) return;
    this.habilidadeAtual.cancelar(); // ex.: perde a carga do Foco ao trocar
    this.indiceHabilidade = indice;
    Estado.habilidade = indice;
  }

  // Proteção curta (pisca): ao levar dano e ao entrar numa sala nova
  // atrasoPisca: no dano, o pisca-pisca só começa depois da animação de dano (senão ela some no meio)
  ficarInvencivel(ms: number, atrasoPisca = 0): void {
    this.invencivel = true;
    this.tempoInvencibilidade = ms;
    this.actions.clearActions();
    this.graphics.visible = true;
    this.actions.delay(atrasoPisca).blink(80, 80, Math.max(1, Math.round((ms - atrasoPisca) / 160)));
  }

  get estaMorto(): boolean {
    return this.morto;
  }

  levarDano(quantidade: number): void {
    // "morto": evita levar dano de novo no mesmo quadro e chamar o game over duas vezes
    if (this.invencivel || this.morto) return;

    this.hp -= quantidade;
    Estado.hp = this.hp;
    this.scene?.camera.shake(2, 2, 150); // tranco na tela: o jogador sente o golpe

    if (this.hp <= 0) {
      this.morrer();
    } else {
      // Animação de dano do Figma: a sombra acerta a luz e ela se recupera
      this.tocandoDano = true;
      this.visual.dano.reset();
      this.graphics.use(this.visual.dano);
      this.ficarInvencivel(1000, 360);
    }
  }

  // Morte: a escuridão engole a luz (animação do Figma, ~1 s), a tela treme
  // e o game over vem logo depois que a animação termina.
  private morrer(): void {
    this.morto = true;
    const cena = this.scene;
    if (!cena) return;
    this.vel = vec(0, 0);
    this.body.collisionType = CollisionType.PreventCollision; // tiros e robôs passam direto
    this.actions.clearActions(); // para o pisca-pisca da invencibilidade
    this.graphics.visible = true;
    this.visual.morte.reset();
    this.graphics.use(this.visual.morte);
    cena.camera.shake(4, 4, 400);
    cena.engine.clock.schedule(() => {
      if (cena.engine.currentScene === cena) cena.engine.goToScene("gameover");
    }, 1400);
  }
}
