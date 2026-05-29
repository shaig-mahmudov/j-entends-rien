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
  config: VisualConfig;
};

export function WaveformLandscape({ time, energy, beatPulse, bands, config }: Props) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(() => Array.from({ length: 72 }, (_, index) => index), []);
  const warm = config.colorPalette.includes("amber");

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.x = -0.35;
      group.current.position.z = Math.sin(time * 0.35) * 0.4;
    }
    state.camera.position.set(Math.sin(time * 0.2) * 1.2, 2.2 + energy * 0.8, 7 - beatPulse * 0.5);
    state.camera.lookAt(0, 0, -1);
  });

  return (
    <group ref={group}>
      {bars.map((index) => {
        const x = (index - 36) * 0.16;
        const wave = Math.sin(index * 0.38 + time * 4) * 0.5 + Math.cos(index * 0.14 + time * 2) * 0.3;
        const height = 0.15 + Math.abs(wave) * (0.7 + bands.mid * 1.3) + energy * 0.5 + beatPulse * 0.28;
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
      <mesh position={[0, -1.34, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 10, 1, 1]} />
        <meshStandardMaterial color="#08080f" emissive="#090923" roughness={0.4} />
      </mesh>
    </group>
  );
}
