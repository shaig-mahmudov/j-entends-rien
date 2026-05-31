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

export function ParticleField({ time, energy, beatPulse, bands, features, config }: Props) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const vocalRing = useRef<THREE.Mesh>(null);
  const kickRing = useRef<THREE.Mesh>(null);
  const snareRing = useRef<THREE.Mesh>(null);
  const sparkGroup = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i += 1) {
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
      const scale = 1 + features.kick * 0.28 + bands.bass * 0.2;
      points.current.scale.setScalar(scale);
    }
    if (material.current) {
      material.current.size = 0.02 + bands.bass * 0.1 + features.kick * 0.09 + features.hihat * 0.035;
      material.current.opacity = 0.42 + energy * 0.32 + features.hihat * 0.28;
      material.current.color = new THREE.Color(config.colorPalette.includes("red") ? "#fb7185" : "#22d3ee");
    }
    if (vocalRing.current) {
      vocalRing.current.scale.setScalar(1 + features.vocal * 0.55 + Math.sin(time * 2.4) * 0.04);
      vocalRing.current.rotation.z = time * 0.16;
    }
    if (kickRing.current) {
      kickRing.current.scale.setScalar(1 + features.kick * 1.1);
      (kickRing.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + features.kick * 0.5;
    }
    if (snareRing.current) {
      snareRing.current.scale.setScalar(0.75 + features.snare * 0.95);
      snareRing.current.rotation.z = -time * 0.35;
      (snareRing.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + features.snare * 0.42;
    }
    if (sparkGroup.current) {
      sparkGroup.current.rotation.y = -time * (0.5 + features.hihat);
      sparkGroup.current.scale.setScalar(1 + features.hihat * 0.35);
    }
    state.camera.position.z = 7 - features.kick * 0.65;
    state.camera.position.y = 0.8 + features.vocal * 0.26;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#22d3ee" size={0.045} />
      </points>
      <mesh ref={vocalRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.018 + features.vocal * 0.035, 12, 160]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2 + features.vocal * 0.42} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={kickRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.45, 0.028, 8, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={snareRing} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <torusGeometry args={[3.2, 0.014, 6, 96]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={sparkGroup}>
        {Array.from({ length: 36 }, (_, index) => {
          const angle = (index / 36) * Math.PI * 2;
          const radius = 2.2 + (index % 5) * 0.45;
          return (
            <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle * 2.1) * 1.2, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.018 + features.hihat * 0.05, 8, 8]} />
              <meshBasicMaterial color={index % 2 ? "#f59e0b" : "#e0f2fe"} transparent opacity={0.2 + features.hihat * 0.6} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
