import type { AudioAnalysis } from "@/types/audio";
import type { VisualConfig } from "@/types/visual";

export const demoAnalysis: AudioAnalysis = {
  bpm: 128,
  duration: 96,
  beats: Array.from({ length: 205 }, (_, index) => Number((index * 0.46875).toFixed(3))),
  energyCurve: Array.from({ length: 96 }, (_, index) => ({
    time: index,
    value: Number((0.32 + Math.sin(index / 6) * 0.18 + (index > 48 ? 0.28 : 0)).toFixed(3))
  })),
  frequencyBands: Array.from({ length: 96 }, (_, index) => ({
    time: index,
    bass: Number((0.35 + Math.sin(index / 3) * 0.25 + (index > 48 ? 0.25 : 0)).toFixed(3)),
    mid: Number((0.26 + Math.cos(index / 5) * 0.18).toFixed(3)),
    treble: Number((0.22 + Math.sin(index / 2) * 0.16).toFixed(3))
  })),
  reactiveFeatures: Array.from({ length: 96 }, (_, index) => ({
    time: index,
    kick: index % 2 === 0 ? 0.95 : 0.2,
    snare: index % 4 === 2 ? 0.8 : 0.18,
    hihat: index % 1 === 0 ? Number((0.35 + Math.sin(index * 1.7) * 0.28).toFixed(3)) : 0.1,
    vocal: Number((0.32 + Math.sin(index / 4) * 0.28 + (index > 24 && index < 72 ? 0.2 : 0)).toFixed(3)),
    drums: index % 2 === 0 ? 0.9 : 0.35
  })),
  sections: [
    { start: 0, end: 24, type: "intro", intensity: 0.32 },
    { start: 24, end: 48, type: "verse", intensity: 0.48 },
    { start: 48, end: 78, type: "chorus_or_drop", intensity: 0.9 },
    { start: 78, end: 96, type: "outro", intensity: 0.52 }
  ]
};

export const demoVisualConfig: VisualConfig = {
  vibe: "dark neon dreamy",
  mood: "cinematic and hypnotic",
  colorPalette: ["black", "violet", "blue", "cyan"],
  visualStyle: "neon particles in deep space",
  cameraStyle: "slow floating camera with fast zooms on beat drops",
  effects: {
    beatPulse: true,
    bassDistortion: true,
    lyricHighlights: true,
    particleExplosions: true
  },
  scenes: [
    { start: 0, end: 24, sceneType: "particle_field", description: "Slow floating particles", intensity: 0.32 },
    { start: 24, end: 48, sceneType: "waveform_landscape", description: "Waveform mountains reacting to vocals", intensity: 0.48 },
    { start: 48, end: 78, sceneType: "neon_tunnel", description: "Fast tunnel movement synced to beat and bass", intensity: 0.9 },
    { start: 78, end: 96, sceneType: "particle_field", description: "Cooling particles and fading trails", intensity: 0.52 }
  ],
  lyricsMoments: [{ time: 42.5, text: "falling", visualCue: "falling light streaks" }]
};

export function sampleCurve<T extends { time: number }>(items: T[] | undefined, time: number): T | undefined {
  if (!items?.length) return undefined;
  return items.reduce((nearest, item) => (Math.abs(item.time - time) < Math.abs(nearest.time - time) ? item : nearest), items[0]);
}
