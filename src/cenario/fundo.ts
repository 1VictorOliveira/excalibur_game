// src/cenario/fundo.ts
import {
  Actor,
  Color,
  EmitterType,
  Engine,
  Graphic,
  GraphicsGroup,
  ParticleEmitter,
  Rectangle,
  Scene,
  vec,
} from "excalibur";
import { Recursos } from "../recursos";

/*
  Fundo animado do espaço, em camadas (de trás para frente):
  1. Nebulosa base (imagem parada)
  2. Brilho violeta e azul pulsando fora de fase -> o espaço "respira" e muda de tom
  3. Poeira cósmica flutuando
  4. Estrelas em 3 camadas de profundidade, derivando devagar (as de perto andam mais rápido)
     - todas piscam; algumas de vez em quando dão um "flash" em forma de cruz
  5. Estrelas cadentes
*/

const Z_FUNDO = -100;
const DERIVA = vec(-1, 0.35); // direção em que o céu "anda"

// ---------- 1 e 2: nebulosa que pulsa ----------
class Nebulosa extends Actor {
  private tempo = 0;
  private violeta = Recursos.BrilhoVioleta.toSprite();
  private azul = Recursos.BrilhoAzul.toSprite();

  constructor() {
    super({ pos: vec(0, 0), anchor: vec(0, 0), z: Z_FUNDO });
  }

  override onInitialize(): void {
    this.graphics.use(
      new GraphicsGroup({
        members: [
          { graphic: Recursos.Nebulosa.toSprite(), offset: vec(0, 0) },
          { graphic: this.violeta, offset: vec(0, 0) },
          { graphic: this.azul, offset: vec(0, 0) },
        ],
      }),
    );
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;
    this.violeta.opacity = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(this.tempo * 1.25));
    this.azul.opacity = 0.3 * (0.5 + 0.5 * Math.sin(this.tempo * 0.8 + 2));
  }
}

// ---------- 4: estrelas ----------
const CORES_ESTRELA = ["#ffffff", "#fff4b0", "#d9c8ff", "#a98bff", "#8fd8ff"];

function corAleatoria(): Color {
  return Color.fromHex(CORES_ESTRELA[Math.floor(Math.random() * CORES_ESTRELA.length)]);
}

function ponto(cor: Color, tamanho = 1): Graphic {
  return new Rectangle({ width: tamanho, height: tamanho, color: cor });
}

// Cruz com braços que vão enfraquecendo (raio = tamanho do braço)
function cruz(cor: Color, raio: number): Graphic {
  const membros = [{ graphic: ponto(Color.White), offset: vec(raio, raio) }];
  for (let i = 1; i <= raio; i++) {
    const c = cor.clone();
    c.a = 1 - i / (raio + 1);
    for (const [dx, dy] of [[i, 0], [-i, 0], [0, i], [0, -i]]) {
      membros.push({ graphic: ponto(c), offset: vec(raio + dx, raio + dy) });
    }
  }
  return new GraphicsGroup({ members: membros });
}

type Camada = { velocidade: number; tamanho: number; brilho: number };
const CAMADAS: Camada[] = [
  { velocidade: 2, tamanho: 1, brilho: 0.45 }, // longe: lentas e fracas
  { velocidade: 5, tamanho: 1, brilho: 0.7 },
  { velocidade: 9, tamanho: 2, brilho: 0.9 }, // perto: rápidas e fortes
];

class Estrela extends Actor {
  private tempo = 0;
  private fase = Math.random() * Math.PI * 2;
  private ritmo = 0.8 + Math.random() * 2.5;
  private normal!: Graphic;
  private flash!: Graphic;
  private esperaFlash = 2000 + Math.random() * 12000;
  private duracaoFlash = 0;

  constructor(
    x: number,
    y: number,
    private camada: Camada,
    private podeFlash: boolean,
  ) {
    super({ pos: vec(x, y), z: Z_FUNDO + 2, vel: DERIVA.scale(camada.velocidade) });
  }

  override onInitialize(): void {
    const cor = corAleatoria();
    this.normal = this.podeFlash ? cruz(cor, 1) : ponto(cor, this.camada.tamanho);
    this.flash = cruz(cor, 3);
    this.graphics.use(this.normal);
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;

    // Dá a volta na tela: saiu de um lado, entra do outro
    const L = engine.drawWidth;
    const A = engine.drawHeight;
    if (this.pos.x < -4) this.pos.x = L + 4;
    if (this.pos.x > L + 4) this.pos.x = -4;
    if (this.pos.y > A + 4) this.pos.y = -4;
    if (this.pos.y < -4) this.pos.y = A + 4;

    // Flash: a estrela vira uma cruz grande por um instante
    if (this.podeFlash) {
      this.esperaFlash -= elapsed;
      if (this.esperaFlash <= 0 && this.duracaoFlash <= 0) {
        this.duracaoFlash = 500;
        this.graphics.use(this.flash);
      }
      if (this.duracaoFlash > 0) {
        this.duracaoFlash -= elapsed;
        // sobe e desce o brilho durante o flash
        this.graphics.opacity = Math.sin((1 - this.duracaoFlash / 500) * Math.PI);
        if (this.duracaoFlash <= 0) {
          this.graphics.use(this.normal);
          this.esperaFlash = 4000 + Math.random() * 10000;
        }
        return;
      }
    }

    // Piscar normal
    const onda = 0.5 + 0.5 * Math.sin(this.tempo * this.ritmo + this.fase);
    this.graphics.opacity = this.camada.brilho * (0.25 + 0.75 * onda);
  }
}

// ---------- 5: estrela cadente ----------
class EstrelaCadente extends Actor {
  constructor(x: number, y: number) {
    super({ pos: vec(x, y), z: Z_FUNDO + 3, vel: vec(-190, 85) });
  }

  override onInitialize(): void {
    const membros = [];
    for (let i = 0; i < 12; i++) {
      const cor = Color.fromHex(i < 2 ? "#ffffff" : i < 5 ? "#fff4b0" : "#cdb8ff");
      cor.a = 1 - i / 12;
      membros.push({ graphic: ponto(cor), offset: vec(i * 2, -Math.round(i * 0.9)) });
    }
    this.graphics.use(new GraphicsGroup({ members: membros }));
    this.actions.delay(450).fade(0, 400).die();
  }
}

class GeradorDeCadentes extends Actor {
  private espera = 1500;

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.espera -= elapsed;
    if (this.espera <= 0) {
      this.scene?.add(new EstrelaCadente(140 + Math.random() * 200, -5 + Math.random() * 70));
      this.espera = 2500 + Math.random() * 4500; // entre 2,5 e 7 s
    }
  }
}

// ---------- Monta tudo na cena ----------
export function montarFundo(cena: Scene, engine: Engine): void {
  const L = engine.drawWidth;
  const A = engine.drawHeight;

  cena.add(new Nebulosa());

  // Poeira cósmica
  const poeira = new ParticleEmitter({
    pos: vec(L / 2, A / 2),
    emitterType: EmitterType.Rectangle,
    width: L,
    height: A,
    emitRate: 8,
    isEmitting: true,
    particle: {
      life: 6000,
      minSpeed: 1,
      maxSpeed: 5,
      minSize: 1,
      maxSize: 1,
      beginColor: Color.fromHex("#b59cff"),
      endColor: Color.fromHex("#4a3a8a"),
      opacity: 0.5,
      fade: true,
    },
  });
  poeira.z = Z_FUNDO + 1;
  cena.add(poeira);

  // Estrelas: 70 no total, espalhadas nas 3 camadas; 10 delas dão flash
  for (let i = 0; i < 70; i++) {
    const camada = CAMADAS[i % CAMADAS.length];
    cena.add(new Estrela(Math.random() * L, Math.random() * A, camada, i < 10));
  }

  cena.add(new GeradorDeCadentes());
}
