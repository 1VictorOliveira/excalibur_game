// src/resources.ts
// Centraliza todos os recursos do jogo para pré-carregamento
import { FontSource, ImageSource } from "excalibur";
// O Vite resolve o caminho certo das imagens (inclusive no GitHub Pages)
import logoUrl from "./assets/logo.png";
// A luz (personagem) e o cristal, desenhados no Figma
import luzParadaUrl from "./assets/luz/luz_parada.png";
import luzAndarUrl from "./assets/luz/luz_andar.png";
import luzDanoUrl from "./assets/luz/luz_dano.png";
import luzMorteUrl from "./assets/luz/luz_morte.png";
import iconesUrl from "./assets/luz/icones.png";
import cristalUrl from "./assets/luz/cristal.png";
import coletaUrl from "./assets/luz/coleta.png";
import nebulosaUrl from "./assets/nebulosa.png";
import brilhoVioletaUrl from "./assets/nebulosa_brilho_violeta.png";
import brilhoAzulUrl from "./assets/nebulosa_brilho_azul.png";
// Textos animados feitos no Figma (cada folha: 1 linha de 8 quadros)
import gameOverUrl from "./assets/textos/game_over.png";
import salaPurificadaUrl from "./assets/textos/sala_purificada.png";
import salaSantuarioUrl from "./assets/textos/sala_santuario.png";
// Botões (cada folha: 3 linhas x 4 quadros de 96x16 -> normal, escolhido, apertado)
import botaoJogarUrl from "./assets/textos/botao_jogar.png";
import botaoOpcoesUrl from "./assets/textos/botao_opcoes.png";
import botaoVoltarUrl from "./assets/textos/botao_voltar.png";
// Faísca de luz (6 quadros de 16x16): substitui as partículas feitas por código
import faiscaUrl from "./assets/faisca.png";

// Fonte arcade retrô
// BASE_URL: "/" no PC e "/excalibur_game/" no GitHub Pages.
// Com "/fonts/..." fixo, a fonte não carregava depois do deploy.
export const FontArcade = new FontSource(
  `${import.meta.env.BASE_URL}fonts/PressStart2P-Regular.ttf`,
  "PressStart2P"
);

// Lista de todos os recursos para o Loader
export const Resources = {
  FontArcade,
  Logo: new ImageSource(logoUrl), // título REFRACT (200x56)
  // Luz (personagem), quadros de 32x32
  LuzParada: new ImageSource(luzParadaUrl), // 4 quadros: brilhando parada
  LuzAndar: new ImageSource(luzAndarUrl), // 3 linhas x 4: direita, baixo, cima (esquerda = direita espelhada)
  LuzDano: new ImageSource(luzDanoUrl), // 4 quadros: a sombra acerta e a luz se recupera
  LuzMorte: new ImageSource(luzMorteUrl), // 8 quadros: a escuridão engole a luz
  Icones: new ImageSource(iconesUrl), // 2 linhas x 3: normal / escolhido de REFLEXAO, FOCO, PRISMA
  Cristal: new ImageSource(cristalUrl), // 4 quadros de 16x16: cristal flutuando
  CristalColeta: new ImageSource(coletaUrl), // 4 quadros de 16x16: cristal sendo pego
  Nebulosa: new ImageSource(nebulosaUrl), // fundo do espaço (320x180)
  BrilhoVioleta: new ImageSource(brilhoVioletaUrl), // camadas que pulsam por cima da nebulosa
  BrilhoAzul: new ImageSource(brilhoAzulUrl),

  GameOver: new ImageSource(gameOverUrl), // 8 quadros de 168x31
  SalaPurificada: new ImageSource(salaPurificadaUrl), // 8 quadros de 159x22
  SalaSantuario: new ImageSource(salaSantuarioUrl), // 8 quadros de 181x22
  BotaoJogar: new ImageSource(botaoJogarUrl),
  BotaoOpcoes: new ImageSource(botaoOpcoesUrl),
  BotaoVoltar: new ImageSource(botaoVoltarUrl),
  Faisca: new ImageSource(faiscaUrl), // 6 quadros de 16x16
};

// Array para passar ao Loader
export const loadables = Object.values(Resources);
