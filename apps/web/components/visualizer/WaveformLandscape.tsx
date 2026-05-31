"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { VisualConfig } from "@/types/visual";

type Props = {
  time: number;
  energy: number;
  beatPulse: number;
  bands: { bass: number; mid: number; treble: number };
  features: { kick: number; snare: number; hihat: number; vocal: number; drums: number };
  config: VisualConfig;
};

export function WaveformLandscape({ time, energy, beatPulse, bands, features, config }: Props) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(() => Array.from({ length: 72 }, (_, index) => index), []);
  const vocalBars = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const warm = config.colorPalette.includes("amber");

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.x = -0.35;
      group.current.position.z = Math.sin(time * 0.35) * 0.4 - features.kick * 0.15;
    }
    state.camera.position.set(Math.sin(time * 0.2) * 1.2 + features.snare * 0.18, 2.2 + energy * 0.8 + features.vocal * 0.25, 7 - features.kick * 0.65);
    state.camera.lookAt(0, 0, -1);
  });

  return (
    <group ref={group}>
      {bars.map((index) => {
        const x = (index - 36) * 0.16;
        const wave = Math.sin(index * 0.38 + time * (4 + features.drums * 2)) * 0.5 + Math.cos(index * 0.14 + time * 2) * 0.3;
        const drumLift = index % 8 === 0 ? features.kick * 0.75 : index % 8 === 4 ? features.snare * 0.55 : 0;
        const height = 0.15 + Math.abs(wave) * (0.7 + bands.mid * 1.3) + energy * 0.5 + drumLift + features.hihat * 0.15;
        return (
          <mesh key={index} position={[x, height / 2 - 1.2, -Math.abs(index - 36) * 0.045]} scale={[0.075, height, 0.18 + bands.bass * 0.25]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={warm ? "#f59e0b" : index % 2 ? "#22d3ee" : "#8b5cf6"}
              emissive={warm ? "#f59e0b" : "#22d3ee"}
              emissiveIntensity={0.35 + bands.treble}
              roughness={0.28}
            />
          </mesh>
        );
      })}
      {vocalBars.map((index) => {
        const x = (index - 12) * 0.18;
        const height = 0.1 + features.vocal * (0.5 + Math.sin(time * 5 + index * 0.5) * 0.28) + bands.mid * 0.25;
        return (
          <mesh key={`vocal-${index}`} position={[x, 0.95 + height / 2, -1.45]} scale={[0.045, height, 0.045]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={index % 2 ? "#e0f2fe" : "#8b5cf6"} transparent opacity={0.12 + features.vocal * 0.58} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 28 }, (_, index) => {
        const angle = index * 0.9 + time * 1.8;
        return (
          <mesh key={`spark-${index}`} position={[Math.cos(angle) * (2.4 + index * 0.03), 1.2 + Math.sin(angle * 1.7) * 0.5, -2.1 + Math.sin(angle) * 0.9]}>
            <sphereGeometry args={[0.025 + features.hihat * 0.04, 8, 8]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.1 + features.hihat * 0.65} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      <mesh position={[0, -1.34, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 10, 1, 1]} />
        <meshStandardMaterial color="#08080f" emissive={features.kick > 0.45 ? "#062b35" : "#090923"} roughness={0.4} />
      </mesh>
    </group>
  );
}
