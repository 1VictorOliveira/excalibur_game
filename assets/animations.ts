import { Animation, AnimationStrategy, DefaultLoader, ImageSource, Loader } from "excalibur";
import { ENEMY_CONFIG } from "../src/enemies/config";
import manifest from "./sprites.json";

type AnimationDefinition = {
  pattern: string;
  frames: number;
  loop: boolean;
};

type SpriteManifest = Record<string, Record<string, AnimationDefinition>>;

const definitions = manifest as SpriteManifest;
const frameUrls = import.meta.glob("../src/assets/sprites/frames/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const imageCache = new Map<string, ImageSource>();

function getImage(path: string): ImageSource {
  const cached = imageCache.get(path);
  if (cached) return cached;
  const url = frameUrls[path];
  if (!url) throw new Error(`Sprite não encontrado: ${path}`);
  const image = new ImageSource(url);
  imageCache.set(path, image);
  return image;
}

function getImages(character: string, animName: string): ImageSource[] | undefined {
  const definition = definitions[character]?.[animName];
  if (!definition) return undefined;
  return Array.from({ length: definition.frames }, (_, index) =>
    getImage(definition.pattern.replace("{i}", String(index))),
  );
}

export function loadAllSprites<T extends Loader | DefaultLoader>(loader: T): T;
export function loadAllSprites(): Loader;
export function loadAllSprites(loader: Loader | DefaultLoader = new Loader()): Loader | DefaultLoader {
  for (const [character, animations] of Object.entries(definitions)) {
    for (const animName of Object.keys(animations)) getImages(character, animName);
  }
  for (const image of imageCache.values()) loader.addResource(image);
  return loader;
}

export function getAnimation(
  character: string,
  animName: string,
  phaseDurationMs?: number,
): Animation | undefined {
  const definition = definitions[character]?.[animName];
  const images = getImages(character, animName);
  if (!definition || !images) return undefined;
  const duration = (phaseDurationMs ?? ENEMY_CONFIG.spriteFrameMs) / definition.frames;
  return new Animation({
    frames: images.map((image) => ({ graphic: image.toSprite(), duration })),
    strategy: definition.loop ? AnimationStrategy.Loop : AnimationStrategy.Freeze,
  });
}
