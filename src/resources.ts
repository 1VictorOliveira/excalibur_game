// src/resources.ts
import { FontSource, ImageSource } from "excalibur";
import logoUrl from "./assets/logo.png";
// Personagem e cristal
import luzParadaUrl from "./assets/luz/luz_parada.png";
import luzAndarUrl from "./assets/luz/luz_andar.png";
import luzDanoUrl from "./assets/luz/luz_dano.png";
import luzMorteUrl from "./assets/luz/luz_morte.png";
import iconesUrl from "./assets/luz/icones.png";
import cristalUrl from "./assets/luz/cristal.png";
import coletaUrl from "./assets/luz/coleta.png";
// Mapa
import fundoInicioUrl from "./assets/mapa/fundo_inicio.png";
import fundoLabirintoUrl from "./assets/mapa/fundo_labirinto.png";
import fundoArenaUrl from "./assets/mapa/fundo_arena.png";
import fundoTesouroUrl from "./assets/mapa/fundo_tesouro.png";
import blocoRunaUrl from "./assets/mapa/bloco_runa.png";
import blocoLuzUrl from "./assets/mapa/bloco_luz.png";
import blocoDemonioUrl from "./assets/mapa/bloco_demonio.png";
// Tiros
import tiroPrismaUrl from "./assets/tiros/tiro_prisma.png";
import tiroPrismaImpactoUrl from "./assets/tiros/tiro_prisma_impacto.png";
import focoCargaUrl from "./assets/tiros/foco_carga.png";
import focoImpactoUrl from "./assets/tiros/foco_impacto.png";
import focoInicioUrl from "./assets/tiros/foco_inicio.png";
import focoCorpoUrl from "./assets/tiros/foco_corpo.png";
import focoPontaUrl from "./assets/tiros/foco_ponta.png";
// Menu
import nebulosaUrl from "./assets/nebulosa.png";
import brilhoVioletaUrl from "./assets/nebulosa_brilho_violeta.png";
import brilhoAzulUrl from "./assets/nebulosa_brilho_azul.png";
// Textos animados (8 quadros por folha)
import gameOverUrl from "./assets/textos/game_over.png";
import salaPurificadaUrl from "./assets/textos/sala_purificada.png";
import salaSantuarioUrl from "./assets/textos/sala_santuario.png";
// Botões: 3 linhas (normal, escolhido, apertado) x 4 quadros de 96x16
import botaoJogarUrl from "./assets/textos/botao_jogar.png";
import botaoOpcoesUrl from "./assets/textos/botao_opcoes.png";
import botaoVoltarUrl from "./assets/textos/botao_voltar.png";
// Faísca (6 quadros de 16x16)
import faiscaUrl from "./assets/faisca.png";

// BASE_URL muda no GitHub Pages ("/excalibur_game/")
export const FontArcade = new FontSource(
  `${import.meta.env.BASE_URL}fonts/PressStart2P-Regular.ttf`,
  "PressStart2P"
);

export const Resources = {
  FontArcade,
  Logo: new ImageSource(logoUrl), // título REFRACT (200x56)
  // Personagem (32x32)
  LuzParada: new ImageSource(luzParadaUrl), // 4 quadros
  LuzAndar: new ImageSource(luzAndarUrl), // linhas: direita, baixo, cima
  LuzDano: new ImageSource(luzDanoUrl), // 4 quadros
  LuzMorte: new ImageSource(luzMorteUrl), // 8 quadros
  Icones: new ImageSource(iconesUrl), // 16x16; linhas: normal, escolhido
  Cristal: new ImageSource(cristalUrl), // 4 quadros de 16x16
  CristalColeta: new ImageSource(coletaUrl), // 4 quadros de 16x16

  // Mapa: fundos 320x180 e blocos
  FundoInicio: new ImageSource(fundoInicioUrl),
  FundoLabirinto: new ImageSource(fundoLabirintoUrl),
  FundoArena: new ImageSource(fundoArenaUrl),
  FundoTesouro: new ImageSource(fundoTesouroUrl),
  BlocoRuna: new ImageSource(blocoRunaUrl),
  BlocoLuz: new ImageSource(blocoLuzUrl),
  BlocoDemonio: new ImageSource(blocoDemonioUrl),

  // Linhas do Prisma: vermelho, verde, azul. Linhas do Foco: carga fraca, média, cheia
  TiroPrisma: new ImageSource(tiroPrismaUrl), // 24x12
  TiroPrismaImpacto: new ImageSource(tiroPrismaImpactoUrl), // 16x16
  FocoCarga: new ImageSource(focoCargaUrl), // 12x12, 4 níveis
  FocoImpacto: new ImageSource(focoImpactoUrl), // 32x32
  FocoInicio: new ImageSource(focoInicioUrl), // 16x16
  FocoCorpo: new ImageSource(focoCorpoUrl), // 16x8, repetido
  FocoPonta: new ImageSource(focoPontaUrl), // 16x16
  Nebulosa: new ImageSource(nebulosaUrl), // 320x180
  BrilhoVioleta: new ImageSource(brilhoVioletaUrl),
  BrilhoAzul: new ImageSource(brilhoAzulUrl),

  GameOver: new ImageSource(gameOverUrl), // 8 quadros de 168x31
  SalaPurificada: new ImageSource(salaPurificadaUrl), // 8 quadros de 159x22
  SalaSantuario: new ImageSource(salaSantuarioUrl), // 8 quadros de 181x22
  BotaoJogar: new ImageSource(botaoJogarUrl),
  BotaoOpcoes: new ImageSource(botaoOpcoesUrl),
  BotaoVoltar: new ImageSource(botaoVoltarUrl),
  Faisca: new ImageSource(faiscaUrl), // 6 quadros de 16x16
};

export const loadables = Object.values(Resources);
