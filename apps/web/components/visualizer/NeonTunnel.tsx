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
  config: VisualConfig;
};

export function NeonTunnel({ time, energy, beatPulse, bands, config }: Props) {
  const group = useRef<THREE.Group>(null);
  const hot = config.colorPalette.includes("red");

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = time * (0.18 + energy * 0.2);
    group.current.position.z = Math.sin(time * 0.8) * 0.6;
    state.camera.position.z = 6 - beatPulse * 0.9 - bands.bass * 0.35;
    state.camera.position.x = Math.sin(time * 0.45) * energy * 0.7;
    state.camera.lookAt(0, 0, -4);
  });

  return (
    <group ref={group}>
      {Array.from({ length: 28 }, (_, index) => {
        const z = -index * 0.72 + ((time * (1.6 + energy * 4)) % 0.72);
        const scale = 1 + index * 0.035 + beatPulse * 0.05;
        const color = index % 3 === 0 ? (hot ? "#fb7185" : "#22d3ee") : index % 3 === 1 ? "#8b5cf6" : "#f59e0b";
        return (
          <mesh key={index} position={[0, 0, z]} rotation={[0, 0, index * 0.18]} scale={[scale, scale, scale]}>
            <torusGeometry args={[1.45 + bands.bass * 0.18, 0.012 + bands.treble * 0.018, 8, 96]} />
            <meshBasicMaterial color={color} transparent opacity={0.18 + energy * 0.28} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </group>
  );
}
