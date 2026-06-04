"use client";

import { CinematicBackdrop } from "@/components/visualizer/CinematicBackdrop";
import { CinematicCamera } from "@/components/visualizer/CinematicCamera";
import { ParticleField } from "@/components/visualizer/ParticleField";
import { NeonTunnel } from "@/components/visualizer/NeonTunnel";
import { WaveformLandscape } from "@/components/visualizer/WaveformLandscape";
import { useAppStore } from "@/lib/store";
import { beatPulseAt, clamp, getSceneBlend, getSectionIntensity, resolvePalette, sampleCurve } from "@/lib/visualEngine";
import type { AudioAnalysis } from "@/types/audio";
import type { SceneType, VisualConfig } from "@/types/visual";

type Props = {
  preset?: SceneType | "timeline";
  analysis: AudioAnalysis;
  config: VisualConfig;
  time: number;
};

export function AudioReactiveScene({ preset, analysis, config, time }: Props) {
  const realtimeBands = useAppStore((state) => state.realtimeBands);
  const curve = sampleCurve(analysis.energyCurve, time);
  const bands = sampleCurve(analysis.frequencyBands, time);
  const sampledFeatures = sampleCurve(analysis.reactiveFeatures, time);
  const sectionIntensity = getSectionIntensity(analysis, time);
  const beatPulse = Math.max(beatPulseAt(analysis.beats, time), realtimeBands.bass * 0.45);
  const energy = clamp(Math.max(curve?.value ?? 0.25, realtimeBands.bass * 0.8) * (0.82 + sectionIntensity * 0.36));
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
  const palette = resolvePalette(config);
  const blend = getSceneBlend(config, time, preset === "timeline" ? undefined : preset);
  const reactive = { energy, beatPulse, bands: reactiveBands, features };
  const common = { time, ...reactive, config, palette, sceneIntensity: blend.active.intensity };

  return (
    <>
      <CinematicCamera time={time} blend={blend} {...reactive} />
      <CinematicBackdrop time={time} energy={energy} beatPulse={beatPulse} palette={palette} sceneIntensity={blend.active.intensity} />
      <ParticleField {...common} weight={blend.weights.particle_field} />
      <WaveformLandscape {...common} weight={blend.weights.waveform_landscape} />
      <NeonTunnel {...common} weight={blend.weights.neon_tunnel} />
    </>
  );
}
