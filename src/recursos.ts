// src/recursos.ts
import { FontSource, ImageSource } from "excalibur";
// O Vite resolve o caminho certo dos arquivos (inclusive no GitHub Pages)
import luzUrl from "./assets/luz.png";
import nebulosaUrl from "./assets/nebulosa.png";
import brilhoVioletaUrl from "./assets/nebulosa_brilho_violeta.png";
import brilhoAzulUrl from "./assets/nebulosa_brilho_azul.png";
import fonteUrl from "./assets/fontes/PressStart2P.ttf";
import logoUrl from "./assets/logo.png";
import { Carregador } from "./ui/carregador";

export const Recursos = {
  Luz: new ImageSource(luzUrl),
  Nebulosa: new ImageSource(nebulosaUrl),
  BrilhoVioleta: new ImageSource(brilhoVioletaUrl),
  BrilhoAzul: new ImageSource(brilhoAzulUrl),
  Logo: new ImageSource(logoUrl),
  // Fonte pixel "Press Start 2P" (licença SIL OFL 1.1, livre para usar)
  // Nome da família sem espaço nem número: "Press Start 2P" sem aspas é inválido em CSS e cai na fonte padrão
  Fonte: new FontSource(fonteUrl, "RefractPixel"),
};

export const loader = new Carregador({ loadables: Object.values(Recursos) });
