"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { RenderPalette } from "@/lib/visualEngine";
import type { VisualConfig } from "@/types/visual";

type Props = {
  time: number;
  energy: number;
  beatPulse: number;
  bands: { bass: number; mid: number; treble: number };
  features: { kick: number; snare: number; hihat: number; vocal: number; drums: number; bassStem: number; vocalStem: number; otherStem: number };
  config: VisualConfig;
  palette: RenderPalette;
  weight: number;
  sceneIntensity: number;
};

export function WaveformLandscape({ time, energy, beatPulse, bands, features, config, palette, weight, sceneIntensity }: Props) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(() => Array.from({ length: 72 }, (_, index) => index), []);
  const vocalBars = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const terrain = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(12, 7.5, 72, 28);
    const base = new Float32Array(geometry.attributes.position.array as ArrayLike<number>);
    return { geometry, base };
  }, []);

  useFrame(() => {
    const position = terrain.geometry.attributes.position as THREE.BufferAttribute;
    const values = position.array as Float32Array;
    for (let index = 0; index < values.length; index += 3) {
      const x = terrain.base[index];
      const y = terrain.base[index + 1];
      const ridge =
        Math.sin(x * 1.4 + time * (1.2 + features.drums * 0.9)) * 0.34 +
        Math.cos(y * 1.85 - time * (0.8 + bands.mid)) * 0.24 +
        Math.sin((x + y) * 1.1 + time * 0.55) * 0.16;
      const centerLift = Math.max(0, 1 - Math.abs(x) / 6) * (features.bassStem * 0.65 + features.kick * 0.42);
      const vocalRidge = Math.sin(x * 3.1 + time * 2.1) * features.vocalStem * 0.18;
      values[index + 2] = (ridge * (0.45 + energy * 0.8) + centerLift + vocalRidge) * (0.65 + weight * 0.7);
    }
    position.needsUpdate = true;

    if (group.current) {
      group.current.rotation.x = -0.35;
      group.current.position.z = Math.sin(time * 0.35) * 0.4 - features.kick * 0.15;
      group.current.position.y = -0.12 + (1 - weight) * -0.25;
    }
  });

  if (weight <= 0.01) return null;

  return (
    <group ref={group}>
      <mesh position={[0, -1.22, -2.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive attach="geometry" object={terrain.geometry} />
        <meshStandardMaterial
          color={palette.surface}
          emissive={palette.primary}
          emissiveIntensity={weight * (0.22 + bands.mid * 0.4 + sceneIntensity * 0.2)}
          transparent
          opacity={weight * (0.28 + energy * 0.22)}
          roughness={0.36}
          wireframe
        />
      </mesh>
      {bars.map((index) => {
        const x = (index - 36) * 0.16;
        const wave = Math.sin(index * 0.38 + time * (4 + features.drums * 2)) * 0.5 + Math.cos(index * 0.14 + time * 2) * 0.3;
        const drumLift = index % 8 === 0 ? features.kick * 0.75 : index % 8 === 4 ? features.snare * 0.55 : 0;
        const bassLift = Math.max(0, 1 - Math.abs(index - 36) / 36) * features.bassStem * 0.8;
        const height = 0.15 + Math.abs(wave) * (0.7 + bands.mid * 1.3) + energy * 0.35 + drumLift + bassLift + features.hihat * 0.15;
        return (
          <mesh key={index} position={[x, height / 2 - 1.16, -Math.abs(index - 36) * 0.045 - 0.35]} scale={[0.045, height * 0.9, 0.12 + bands.bass * 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? palette.primary : index % 3 === 1 ? palette.secondary : palette.accent}
              emissive={index % 4 === 0 ? palette.highlight : palette.primary}
              emissiveIntensity={weight * (0.32 + bands.treble + sceneIntensity * 0.25)}
              transparent
              opacity={weight * (0.64 + energy * 0.3)}
              roughness={0.28}
            />
          </mesh>
        );
      })}
      {vocalBars.map((index) => {
        const x = (index - 12) * 0.18;
        const height = 0.1 + features.vocalStem * (0.62 + Math.sin(time * 5 + index * 0.5) * 0.28) + bands.mid * 0.2;
        return (
          <mesh key={`vocal-${index}`} position={[x, 0.95 + height / 2, -1.45]} scale={[0.045, height, 0.045]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={index % 2 ? palette.muted : palette.secondary} transparent opacity={weight * (0.12 + features.vocalStem * 0.62)} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 7 }, (_, row) => {
        const z = -0.45 - row * 0.52;
        const opacity = weight * (0.07 + row * 0.012 + features.kick * 0.08);
        return (
          <mesh key={`horizon-${row}`} position={[0, -1.05 + row * 0.13, z]} rotation={[0, 0, 0]}>
            <boxGeometry args={[10 - row * 0.65, 0.012, 0.018]} />
            <meshBasicMaterial color={row % 2 ? palette.primary : palette.secondary} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 28 }, (_, index) => {
        const angle = index * 0.9 + time * 1.8;
        return (
          <mesh key={`spark-${index}`} position={[Math.cos(angle) * (2.4 + index * 0.03), 1.2 + Math.sin(angle * 1.7) * 0.5, -2.1 + Math.sin(angle) * 0.9]}>
            <sphereGeometry args={[0.025 + features.hihat * 0.04, 8, 8]} />
            <meshBasicMaterial color={palette.highlight} transparent opacity={weight * (0.1 + features.hihat * 0.65)} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      <mesh position={[0, -1.34, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 10, 1, 1]} />
        <meshStandardMaterial color={palette.surface} emissive={features.kick > 0.45 ? palette.primary : palette.background} emissiveIntensity={weight * 0.22} roughness={0.4} transparent opacity={weight} />
      </mesh>
    </group>
  );
}
