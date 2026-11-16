const HIGH_SCORE_KEY = "berzerk-excalibur.highScore";

type ScoreListener = (current: number, highScore: number) => void;

function readHighScore(): number {
  try {
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(saved) && saved >= 0 ? saved : 0;
  } catch {
    return 0;
  }
}

class ScoreManager {
  private current = 0;
  private highest = readHighScore();
  private readonly listeners = new Set<ScoreListener>();

  get value(): number {
    return this.current;
  }

  get highScore(): number {
    return this.highest;
  }

  add(points: number): void {
    this.current += points;
    if (this.current > this.highest) {
      this.highest = this.current;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highest));
      } catch {
      }
    }
    this.emit();
  }

  reset(): void {
    this.current = 0;
    this.emit();
  }

  subscribe(listener: ScoreListener): () => void {
    this.listeners.add(listener);
    listener(this.current, this.highest);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.current, this.highest);
  }
}

export const score = new ScoreManager();
