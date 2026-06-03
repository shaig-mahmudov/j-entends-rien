"use client";

import { ParticleField } from "@/components/visualizer/ParticleField";
import { NeonTunnel } from "@/components/visualizer/NeonTunnel";
import { WaveformLandscape } from "@/components/visualizer/WaveformLandscape";
import { sampleCurve } from "@/lib/visualConfig";
import { useAppStore } from "@/lib/store";
import type { AudioAnalysis } from "@/types/audio";
import type { SceneType, VisualConfig } from "@/types/visual";

type Props = {
  preset: SceneType;
  analysis: AudioAnalysis;
  config: VisualConfig;
  time: number;
};

export function AudioReactiveScene({ preset, analysis, config, time }: Props) {
  const realtimeBands = useAppStore((state) => state.realtimeBands);
  const curve = sampleCurve(analysis.energyCurve, time);
  const bands = sampleCurve(analysis.frequencyBands, time);
  const sampledFeatures = sampleCurve(analysis.reactiveFeatures, time);
  const beatDistance = Math.min(...analysis.beats.map((beat) => Math.abs(beat - time)).slice(0, 1000), 1);
  const beatPulse = Math.max(0, 1 - beatDistance * 8);
  const energy = Math.max(curve?.value ?? 0.25, realtimeBands.bass * 0.8);
  const reactiveBands = {
    bass: Math.max(bands?.bass ?? 0, realtimeBands.bass),
    mid: Math.max(bands?.mid ?? 0, realtimeBands.mid),
    treble: Math.max(bands?.treble ?? 0, realtimeBands.treble)
  };
  const features = {
    kick: Math.max(sampledFeatures?.kick ?? 0, beatPulse * reactiveBands.bass),
    snare: Math.max(sampledFeatures?.snare ?? 0, beatPulse * reactiveBands.mid * 0.85),
    hihat: Math.max(sampledFeatures?.hihat ?? 0, beatPulse * reactiveBands.treble * 0.7),
    vocal: Math.max(sampledFeatures?.vocal ?? 0, reactiveBands.mid * 0.9),
    drums: Math.max(sampledFeatures?.drums ?? 0, beatPulse),
    bassStem: Math.max(sampledFeatures?.bassStem ?? 0, reactiveBands.bass),
    vocalStem: Math.max(sampledFeatures?.vocalStem ?? 0, sampledFeatures?.vocal ?? 0, reactiveBands.mid * 0.8),
    otherStem: Math.max(sampledFeatures?.otherStem ?? 0, energy * 0.35)
  };
  const common = { time, energy, beatPulse, bands: reactiveBands, features, config };

  if (preset === "neon_tunnel") return <NeonTunnel {...common} />;
  if (preset === "waveform_landscape") return <WaveformLandscape {...common} />;
  return <ParticleField {...common} />;
}
