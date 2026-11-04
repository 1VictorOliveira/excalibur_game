// src/actors/parede.ts
import { Actor, CollisionType, Color, Engine, GraphicsGroup, Rectangle, vec } from "excalibur";
import { Grupos } from "../grupos";

/*
  Parede de energia:
  - brilho: aura transparente que passa 2 px para fora da parede
  - corpo: faixa ciano que é a parte sólida (igual à caixa de colisão)
  - núcleo: linha clara no meio, que pulsa e às vezes dá um "estalo" elétrico
  O pulso anda pelo labirinto como uma onda, porque cada parede usa a posição como fase.
*/

const BRILHO = 2; // quantos pixels a aura passa da parede

export class Parede extends Actor {
  private aura: Rectangle;
  private nucleo: Rectangle;
  private tempo = 0;
  private estalo = 0; // ms restantes do estalo elétrico

  constructor(x: number, y: number, largura: number, altura: number) {
    super({
      name: "parede",
      pos: vec(x, y),
      anchor: vec(0, 0), // (x, y) = canto superior esquerdo, facilita montar a sala
      width: largura,
      height: altura,
      collisionType: CollisionType.Fixed, // nunca se move e bloqueia quem é Active
      collisionGroup: Grupos.parede,
    });

    const horizontal = largura >= altura;
    const espessuraNucleo = 2;

    this.aura = new Rectangle({
      width: largura + BRILHO * 2,
      height: altura + BRILHO * 2,
      color: Color.fromHex("#39d5ff"),
    });
    const corpo = new Rectangle({ width: largura, height: altura, color: Color.fromHex("#0b5f7d") });
    this.nucleo = new Rectangle({
      width: horizontal ? largura : espessuraNucleo,
      height: horizontal ? espessuraNucleo : altura,
      color: Color.fromHex("#c8f8ff"),
    });

    const offsetNucleo = horizontal
      ? vec(BRILHO, BRILHO + (altura - espessuraNucleo) / 2)
      : vec(BRILHO + (largura - espessuraNucleo) / 2, BRILHO);

    this.graphics.use(
      new GraphicsGroup({
        members: [
          { graphic: this.aura, offset: vec(0, 0) },
          { graphic: corpo, offset: vec(BRILHO, BRILHO) },
          { graphic: this.nucleo, offset: offsetNucleo },
        ],
      }),
    );
    // Recua o desenho para o corpo ficar exatamente em cima da caixa de colisão
    this.graphics.offset = vec(-BRILHO, -BRILHO);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tempo += elapsed / 1000;

    // Onda de energia: a fase depende da posição, então o brilho "corre" pelo labirinto
    const fase = (this.pos.x + this.pos.y) * 0.03;
    const onda = 0.5 + 0.5 * Math.sin(this.tempo * 3 - fase);

    // Estalo elétrico: de vez em quando a parede pisca forte por um instante
    if (this.estalo <= 0 && Math.random() < 0.002) this.estalo = 60 + Math.random() * 60;
    this.estalo -= elapsed;
    const estalando = this.estalo > 0;

    this.aura.opacity = estalando ? 0.55 : 0.12 + 0.2 * onda;
    this.nucleo.opacity = estalando ? 1 : 0.55 + 0.45 * onda;
  }
}
