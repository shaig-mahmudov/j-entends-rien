"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
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

export function NeonTunnel({ time, energy, beatPulse, bands, features, config, palette, weight, sceneIntensity }: Props) {
  const group = useRef<THREE.Group>(null);
  const vocalCore = useRef<THREE.Mesh>(null);
  const railGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.z = time * (0.14 + energy * 0.22 + features.drums * 0.12 + sceneIntensity * 0.1);
    group.current.position.z = Math.sin(time * 0.8) * 0.6 - features.kick * 0.35;
    group.current.scale.setScalar(0.96 + weight * 0.04);
    if (railGroup.current) {
      railGroup.current.rotation.z = -time * (0.05 + sceneIntensity * 0.08);
      railGroup.current.position.z = (time * (1.2 + energy * 3.4)) % 1.2;
    }
    if (vocalCore.current) {
      vocalCore.current.scale.set(1 + features.vocalStem * 0.55, 1 + features.vocalStem * 0.14, 1 + features.vocalStem * 0.55);
      vocalCore.current.rotation.y = time * 0.5;
    }
  });

  if (weight <= 0.01) return null;

  return (
    <group ref={group}>
      {Array.from({ length: 28 }, (_, index) => {
        const speed = 1.4 + energy * 4.4 + features.drums * 2.4 + sceneIntensity * 1.4;
        const z = -index * 0.72 + ((time * speed) % 0.72);
        const scale = 1 + index * 0.035 + features.kick * 0.11 + features.snare * 0.05;
        const color = index % 3 === 0 ? palette.primary : index % 3 === 1 ? palette.secondary : palette.highlight;
        return (
          <mesh key={index} position={[0, 0, z]} rotation={[0, 0, index * 0.18]} scale={[scale, scale, scale]}>
            <torusGeometry args={[1.45 + features.bassStem * 0.34 + features.kick * 0.14, 0.012 + bands.treble * 0.018 + features.hihat * 0.01, 8, 96]} />
            <meshBasicMaterial color={color} transparent opacity={weight * (0.12 + energy * 0.25 + features.drums * 0.17)} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 18 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const z = -index * 0.9 + ((time * (2 + features.drums * 4 + sceneIntensity * 1.3)) % 0.9);
        return (
          <mesh key={`gate-${index}`} position={[side * (1.75 + features.snare * 0.35), 0, z]} rotation={[0, 0, side * 0.3]}>
            <boxGeometry args={[0.04 + features.snare * 0.05, 1.1 + features.vocalStem * 0.9, 0.05]} />
            <meshBasicMaterial color={side < 0 ? palette.primary : palette.accent} transparent opacity={weight * (0.18 + features.snare * 0.48)} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      <group ref={railGroup}>
        {Array.from({ length: 6 }, (_, rail) => {
          const angle = (rail / 6) * Math.PI * 2 + Math.PI / 6;
          const radius = 2.25 + Math.sin(time * 0.4 + rail) * 0.12;
          return Array.from({ length: 18 }, (_, segment) => {
            const z = -segment * 0.72;
            const pulse = segment % 4 === 0 ? features.kick : segment % 4 === 2 ? features.snare : features.hihat * 0.6;
            return (
              <mesh
                key={`rail-${rail}-${segment}`}
                position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, z]}
                rotation={[0, 0, angle + Math.PI / 2]}
              >
                <boxGeometry args={[0.055 + pulse * 0.04, 0.64 + sceneIntensity * 0.34, 0.035]} />
                <meshBasicMaterial
                  color={rail % 3 === 0 ? palette.primary : rail % 3 === 1 ? palette.secondary : palette.accent}
                  transparent
                  opacity={weight * (0.09 + pulse * 0.38 + sceneIntensity * 0.04)}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            );
          });
        })}
      </group>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = index * 0.628 + time * (0.5 + features.hihat);
        const radius = 2.1 + Math.sin(time + index) * 0.18;
        return (
          <mesh key={`streak-${index}`} position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.45, -2.5 - index * 0.65]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.015 + features.hihat * 0.035, 0.9 + sceneIntensity * 0.9, 0.025]} />
            <meshBasicMaterial color={index % 2 ? palette.accent : palette.muted} transparent opacity={weight * (0.08 + features.hihat * 0.38)} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = index * 0.52 + time * 0.42;
        const z = -1.2 - index * 0.52;
        const radius = 1.1 + features.bassStem * 0.38 + Math.sin(time + index) * 0.07;
        return (
          <mesh key={`inner-panel-${index}`} position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.55, z]} rotation={[0.2, 0.4, angle]}>
            <planeGeometry args={[0.62 + sceneIntensity * 0.3, 0.08 + features.hihat * 0.08]} />
            <meshBasicMaterial color={index % 2 ? palette.highlight : palette.muted} transparent opacity={weight * (0.08 + features.hihat * 0.28)} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
      <mesh ref={vocalCore} position={[0, 0, -4]}>
        <octahedronGeometry args={[0.55 + features.vocalStem * 0.48, 2]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={weight * (0.18 + features.vocalStem * 0.42)} wireframe blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
