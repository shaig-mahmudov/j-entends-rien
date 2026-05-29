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

export function ParticleField({ time, energy, beatPulse, bands, config }: Props) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i += 1) {
      values[i * 3] = (Math.random() - 0.5) * 14;
      values[i * 3 + 1] = (Math.random() - 0.5) * 8;
      values[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return values;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = time * (0.035 + energy * 0.04);
      points.current.rotation.x = Math.sin(time * 0.18) * 0.14;
      const scale = 1 + beatPulse * 0.12 + bands.bass * 0.18;
      points.current.scale.setScalar(scale);
    }
    if (material.current) {
      material.current.size = 0.025 + bands.bass * 0.12 + beatPulse * 0.06;
      material.current.opacity = 0.55 + energy * 0.35 + bands.treble * 0.18;
      material.current.color = new THREE.Color(config.colorPalette.includes("red") ? "#fb7185" : "#22d3ee");
    }
    state.camera.position.z = 7 - beatPulse * 0.45;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#22d3ee" size={0.045} />
    </points>
  );
}
