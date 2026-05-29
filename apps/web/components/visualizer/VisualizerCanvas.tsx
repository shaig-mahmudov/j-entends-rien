"use client";

import { Canvas } from "@react-three/fiber";
import { AudioReactiveScene } from "@/components/visualizer/AudioReactiveScene";
import { LyricsOverlay } from "@/components/visualizer/LyricsOverlay";
import { demoAnalysis, demoVisualConfig } from "@/lib/visualConfig";
import { useAppStore } from "@/lib/store";
import type { SceneType } from "@/types/visual";

type Props = {
  preset?: SceneType;
  compact?: boolean;
};

export function VisualizerCanvas({ preset, compact }: Props) {
  const { project, currentTime, selectedPreset } = useAppStore();
  const analysis = project?.audioAnalysis ?? demoAnalysis;
  const config = project?.visualConfig ?? demoVisualConfig;

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 bg-black ${compact ? "h-[360px]" : "h-[min(68vh,680px)] min-h-[420px]"}`}>
      <Canvas camera={{ position: [0, 0.8, 7], fov: 58 }} dpr={[1, 1.7]}>
        <color attach="background" args={["#050508"]} />
        <fog attach="fog" args={["#050508", 8, 28]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[3, 4, 6]} intensity={2.2} color="#22d3ee" />
        <pointLight position={[-4, -2, 3]} intensity={1.4} color="#fb7185" />
        <AudioReactiveScene preset={preset ?? selectedPreset} analysis={analysis} config={config} time={currentTime} />
      </Canvas>
      <LyricsOverlay config={config} time={currentTime} />
    </div>
  );
}
