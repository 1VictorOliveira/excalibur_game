// src/audio.ts
import { Audio, Sound } from "excalibur";

// Gerenciador de configurações de áudio
export const AudioConfig = {
  // Volumes (0-100)
  volumeGlobal: 100,
  volumeMusica: 80,
  volumeEfeitos: 80,

  // Players de áudio (serão inicializados quando os sons forem carregados)
  musicaAtual: null as Sound | null,
  
  // Carregar configurações salvas
  carregarConfiguracoes(): void {
    const configSalva = localStorage.getItem("audioConfig");
    if (configSalva) {
      const config = JSON.parse(configSalva);
      this.volumeGlobal = config.volumeGlobal ?? 100;
      this.volumeMusica = config.volumeMusica ?? 80;
      this.volumeEfeitos = config.volumeEfeitos ?? 80;
    }
  },

  // Salvar configurações
  salvarConfiguracoes(): void {
    localStorage.setItem("audioConfig", JSON.stringify({
      volumeGlobal: this.volumeGlobal,
      volumeMusica: this.volumeMusica,
      volumeEfeitos: this.volumeEfeitos,
    }));
  },

  // Calcular volume real da música (considerando volume global e de música)
  getVolumeMusica(): number {
    return (this.volumeGlobal * this.volumeMusica) / 10000;
  },

  // Calcular volume real dos efeitos (considerando volume global e de efeitos)
  getVolumeEfeitos(): number {
    return (this.volumeGlobal * this.volumeEfeitos) / 10000;
  },

  // Ajustar volume global
  setVolumeGlobal(volume: number): void {
    this.volumeGlobal = Math.max(0, Math.min(100, volume));
    this.salvarConfiguracoes();
    this.atualizarVolumes();
  },

  // Ajustar volume de música
  setVolumeMusica(volume: number): void {
    this.volumeMusica = Math.max(0, Math.min(100, volume));
    this.salvarConfiguracoes();
    this.atualizarVolumes();
  },

  // Ajustar volume de efeitos
  setVolumeEfeitos(volume: number): void {
    this.volumeEfeitos = Math.max(0, Math.min(100, volume));
    this.salvarConfiguracoes();
    this.atualizarVolumes();
  },

  // Atualizar volumes dos players de áudio ativos
  atualizarVolumes(): void {
    if (this.musicaAtual) {
      this.musicaAtual.volume = this.getVolumeMusica();
    }
    // Aqui você pode adicionar lógica para atualizar efeitos sonoros ativos
  },

  // Tocar música
  tocarMusica(sound: Sound, loop: boolean = true): void {
    this.musicaAtual = sound;
    sound.loop = loop;
    sound.volume = this.getVolumeMusica();
    sound.play();
  },

  // Tocar efeito sonoro
  tocarEfeito(sound: Sound): void {
    sound.volume = this.getVolumeEfeitos();
    sound.play();
  },

  // Parar música
  pararMusica(): void {
    if (this.musicaAtual) {
      this.musicaAtual.stop();
      this.musicaAtual = null;
    }
  },
};

// Inicializar configurações ao carregar o módulo
AudioConfig.carregarConfiguracoes();
