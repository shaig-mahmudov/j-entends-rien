import type { AudioAnalysis } from "@/types/audio";
import type { SceneType, VisualConfig, VisualScene } from "@/types/visual";

export type RenderPalette = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  muted: string;
};

export type ReactiveState = {
  energy: number;
  beatPulse: number;
  bands: { bass: number; mid: number; treble: number };
  features: {
    kick: number;
    snare: number;
    hihat: number;
    vocal: number;
    drums: number;
    bassStem: number;
    vocalStem: number;
    otherStem: number;
  };
};

export type SceneWeights = Record<SceneType, number>;

export type SceneBlend = {
  active: VisualScene;
  previous: VisualScene | null;
  next: VisualScene | null;
  weights: SceneWeights;
};

const PALETTE_BY_TOKEN: Record<string, string> = {
  amber: "#f59e0b",
  black: "#050508",
  blue: "#2563eb",
  cyan: "#22d3ee",
  emerald: "#10b981",
  hotpink: "#ec4899",
  magenta: "#d946ef",
  red: "#fb7185",
  rose: "#fb7185",
  silver: "#cbd5e1",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  white: "#f8fafc"
};

const DEFAULT_SCENES: VisualScene[] = [
  { start: 0, end: 24, sceneType: "particle_field", description: "Opening particle drift", intensity: 0.35 },
  { start: 24, end: 48, sceneType: "waveform_landscape", description: "Mid-track waveform terrain", intensity: 0.55 },
  { start: 48, end: 72, sceneType: "neon_tunnel", description: "High-energy tunnel section", intensity: 0.85 }
];

export function resolvePalette(config: VisualConfig): RenderPalette {
  const resolved = config.colorPalette.map((color) => PALETTE_BY_TOKEN[color.toLowerCase()] ?? color).filter(isCssLikeColor);
  const [background = "#050508", primary = "#22d3ee", secondary = "#8b5cf6", accent = "#fb7185", highlight = "#f59e0b"] = resolved;

  return {
    background: background === "#f8fafc" ? "#050508" : background,
    surface: mixHex(background === "#f8fafc" ? "#050508" : background, "#ffffff", 0.06),
    primary,
    secondary,
    accent,
    highlight,
    muted: mixHex(primary, "#ffffff", 0.38)
  };
}

export function getSceneBlend(config: VisualConfig, time: number, forcedPreset?: SceneType): SceneBlend {
  if (forcedPreset) {
    return {
      active: sceneForPreset(forcedPreset, time),
      previous: null,
      next: null,
      weights: { particle_field: forcedPreset === "particle_field" ? 1 : 0, waveform_landscape: forcedPreset === "waveform_landscape" ? 1 : 0, neon_tunnel: forcedPreset === "neon_tunnel" ? 1 : 0 }
    };
  }

  const scenes = normalizeScenes(config.scenes);
  const active = scenes.find((scene) => time >= scene.start && time < scene.end) ?? scenes[scenes.length - 1];
  const index = scenes.indexOf(active);
  const previous = scenes[index - 1] ?? null;
  const next = scenes[index + 1] ?? null;
  const transition = Math.min(2.4, Math.max(0.75, (active.end - active.start) * 0.12));
  const intro = previous ? smoothstep(active.start, active.start + transition, time) : 1;
  const outro = next ? 1 - smoothstep(active.end - transition, active.end, time) : 1;
  const activeWeight = clamp(Math.min(intro, outro), 0, 1);
  const previousWeight = previous ? 1 - intro : 0;
  const nextWeight = next ? 1 - outro : 0;

  return {
    active,
    previous,
    next,
    weights: normalizeWeights({
      particle_field: weightForScene("particle_field", active, activeWeight, previous, previousWeight, next, nextWeight),
      waveform_landscape: weightForScene("waveform_landscape", active, activeWeight, previous, previousWeight, next, nextWeight),
      neon_tunnel: weightForScene("neon_tunnel", active, activeWeight, previous, previousWeight, next, nextWeight)
    })
  };
}

export function getSectionIntensity(analysis: AudioAnalysis, time: number): number {
  const section = analysis.sections.find((item) => time >= item.start && time < item.end) ?? analysis.sections[analysis.sections.length - 1];
  return clamp(section?.intensity ?? 0.5, 0, 1);
}

export function sampleCurve<T extends { time: number }>(items: T[] | undefined, time: number): T | undefined {
  if (!items?.length) return undefined;
  const index = binaryNearestIndex(items, time);
  return items[index];
}

export function beatPulseAt(beats: number[] | undefined, time: number): number {
  if (!beats?.length) return 0;
  const index = binaryNearestNumberIndex(beats, time);
  const distance = Math.abs(beats[index] - time);
  return clamp(1 - distance * 8.5, 0, 1);
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

export function easeInOutSine(value: number): number {
  return -(Math.cos(Math.PI * clamp(value)) - 1) / 2;
}

export function organicNoise(value: number, seed = 0): number {
  return (
    Math.sin(value * 0.73 + seed * 11.13) * 0.5 +
    Math.sin(value * 1.91 + seed * 5.71) * 0.32 +
    Math.sin(value * 3.17 + seed * 2.37) * 0.18
  );
}

export function shotProgress(time: number, shotLength: number): { index: number; phase: number; eased: number } {
  const safeLength = Math.max(0.001, shotLength);
  const position = time / safeLength;
  const phase = position - Math.floor(position);
  return { index: Math.floor(position), phase, eased: easeInOutSine(phase) };
}

function normalizeScenes(scenes: VisualScene[] | undefined): VisualScene[] {
  const usable = (scenes?.length ? scenes : DEFAULT_SCENES)
    .filter((scene) => scene.end > scene.start)
    .sort((a, b) => a.start - b.start);
  return usable.length ? usable : DEFAULT_SCENES;
}

function sceneForPreset(sceneType: SceneType, time: number): VisualScene {
  return { start: Math.max(0, time - 1), end: time + 1, sceneType, description: sceneType, intensity: 0.75 };
}

function weightForScene(
  sceneType: SceneType,
  active: VisualScene,
  activeWeight: number,
  previous: VisualScene | null,
  previousWeight: number,
  next: VisualScene | null,
  nextWeight: number
): number {
  return (active.sceneType === sceneType ? activeWeight : 0) + (previous?.sceneType === sceneType ? previousWeight : 0) + (next?.sceneType === sceneType ? nextWeight : 0);
}

function normalizeWeights(weights: Record<SceneType, number>): Record<SceneType, number> {
  const total = Math.max(0.001, weights.particle_field + weights.waveform_landscape + weights.neon_tunnel);
  return {
    particle_field: weights.particle_field / total,
    waveform_landscape: weights.waveform_landscape / total,
    neon_tunnel: weights.neon_tunnel / total
  };
}

function binaryNearestIndex<T extends { time: number }>(items: T[], time: number): number {
  let low = 0;
  let high = items.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (items[mid].time < time) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && Math.abs(items[low - 1].time - time) < Math.abs(items[low].time - time)) return low - 1;
  return low;
}

function binaryNearestNumberIndex(items: number[], time: number): number {
  let low = 0;
  let high = items.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (items[mid] < time) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && Math.abs(items[low - 1] - time) < Math.abs(items[low] - time)) return low - 1;
  return low;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = clamp((value - edge0) / Math.max(0.001, edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function isCssLikeColor(color: string): boolean {
  return color.startsWith("#") || color.startsWith("rgb") || /^[a-z]+$/i.test(color);
}

function mixHex(a: string, b: string, amount: number): string {
  const first = parseHex(a) ?? [5, 5, 8];
  const second = parseHex(b) ?? [255, 255, 255];
  const mixed = first.map((value, index) => Math.round(value + (second[index] - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(color: string): [number, number, number] | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
  return [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)];
}
