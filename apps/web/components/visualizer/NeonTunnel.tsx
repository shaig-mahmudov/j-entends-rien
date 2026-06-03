"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { VisualConfig } from "@/types/visual";

type Props = {
  time: number;
  energy: number;
  beatPulse: number;
  bands: { bass: number; mid: number; treble: number };
  features: { kick: number; snare: number; hihat: number; vocal: number; drums: number; bassStem: number; vocalStem: number; otherStem: number };
  config: VisualConfig;
};

export function NeonTunnel({ time, energy, beatPulse, bands, features, config }: Props) {
  const group = useRef<THREE.Group>(null);
  const vocalCore = useRef<THREE.Mesh>(null);
  const hot = config.colorPalette.includes("red");

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = time * (0.16 + energy * 0.2 + features.drums * 0.12);
    group.current.position.z = Math.sin(time * 0.8) * 0.6 - features.kick * 0.35;
    if (vocalCore.current) {
      vocalCore.current.scale.set(1 + features.vocalStem * 0.55, 1 + features.vocalStem * 0.14, 1 + features.vocalStem * 0.55);
      vocalCore.current.rotation.y = time * 0.5;
    }
    state.camera.position.z = 6 - features.kick * 1.15 - features.bassStem * 0.55;
    state.camera.position.x = Math.sin(time * 0.45) * energy * 0.7 + features.snare * 0.18;
    state.camera.position.y = 0.8 + features.vocalStem * 0.4;
    state.camera.lookAt(0, 0, -4);
  });

  return (
    <group ref={group}>
      {Array.from({ length: 28 }, (_, index) => {
        const z = -index * 0.72 + ((time * (1.6 + energy * 4 + features.drums * 2)) % 0.72);
        const scale = 1 + index * 0.035 + features.kick * 0.09 + features.snare * 0.04;
        const color = index % 3 === 0 ? (hot ? "#fb7185" : "#22d3ee") : index % 3 === 1 ? "#8b5cf6" : "#f59e0b";
        return (
          <mesh key={index} position={[0, 0, z]} rotation={[0, 0, index * 0.18]} scale={[scale, scale, scale]}>
            <torusGeometry args={[1.45 + features.bassStem * 0.34 + features.kick * 0.14, 0.012 + bands.treble * 0.018 + features.hihat * 0.01, 8, 96]} />
            <meshBasicMaterial color={color} transparent opacity={0.14 + energy * 0.25 + features.drums * 0.16} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 18 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const z = -index * 0.9 + ((time * (2 + features.drums * 4)) % 0.9);
        return (
          <mesh key={`gate-${index}`} position={[side * (1.75 + features.snare * 0.35), 0, z]} rotation={[0, 0, side * 0.3]}>
            <boxGeometry args={[0.04 + features.snare * 0.05, 1.1 + features.vocalStem * 0.9, 0.05]} />
            <meshBasicMaterial color={side < 0 ? "#22d3ee" : "#fb7185"} transparent opacity={0.18 + features.snare * 0.48} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      <mesh ref={vocalCore} position={[0, 0, -4]}>
        <octahedronGeometry args={[0.55 + features.vocalStem * 0.48, 2]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.18 + features.vocalStem * 0.42} wireframe blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
