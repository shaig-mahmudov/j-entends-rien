"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { AudioReactiveScene } from "@/components/visualizer/AudioReactiveScene";
import { LyricsOverlay } from "@/components/visualizer/LyricsOverlay";
import { demoAnalysis, demoVisualConfig } from "@/lib/visualConfig";
import { resolvePalette } from "@/lib/visualEngine";
import { useAppStore } from "@/lib/store";
import type { SceneType } from "@/types/visual";

type Props = {
  preset?: SceneType | "timeline";
  compact?: boolean;
};

export function VisualizerCanvas({ preset, compact }: Props) {
  const { project, currentTime, selectedPreset } = useAppStore();
  const [demoTime, setDemoTime] = useState(0);
  const analysis = project?.audioAnalysis ?? demoAnalysis;
  const config = project?.visualConfig ?? demoVisualConfig;
  const palette = resolvePalette(config);
  const sceneTime = project ? currentTime : demoTime;

  useEffect(() => {
    if (project) return;
    let frame = 0;
    const startedAt = performance.now();
    const tick = () => {
      setDemoTime((performance.now() - startedAt) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [project]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-black ${compact ? "h-[360px]" : "h-[min(68vh,680px)] min-h-[420px]"}`}
      style={{
        background: `radial-gradient(circle at 28% 18%, ${palette.primary}22, transparent 28rem), radial-gradient(circle at 78% 72%, ${palette.secondary}18, transparent 24rem), ${palette.background}`
      }}
    >
      <Canvas
        camera={{ position: [0, 0.8, 7], fov: 58 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={[palette.background]} />
        <fog attach="fog" args={[palette.background, 8, 28]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 4, 6]} intensity={2.5} color={palette.primary} />
        <pointLight position={[-4, -2, 3]} intensity={1.55} color={palette.accent} />
        <pointLight position={[0, 3, -5]} intensity={0.9} color={palette.secondary} />
        <AudioReactiveScene preset={preset ?? selectedPreset} analysis={analysis} config={config} time={sceneTime} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.58)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:100%_6px] mix-blend-screen" />
      <LyricsOverlay config={config} time={sceneTime} />
    </div>
  );
}
