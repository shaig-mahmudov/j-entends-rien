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

export function ParticleField({ time, energy, beatPulse, bands, features, config, palette, weight, sceneIntensity }: Props) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const vocalRing = useRef<THREE.Mesh>(null);
  const kickRing = useRef<THREE.Mesh>(null);
  const snareRing = useRef<THREE.Mesh>(null);
  const sparkGroup = useRef<THREE.Group>(null);
  const ribbonGroup = useRef<THREE.Group>(null);
  const sheetGroup = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const count = 1900;
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963;
      const radius = 0.35 + ((i * 17) % 100) / 100;
      const depth = ((i * 53) % 100) / 100;
      values[i * 3] = Math.cos(angle) * radius * 8.4;
      values[i * 3 + 1] = (Math.sin(i * 0.73) * 0.5 + Math.cos(i * 0.19) * 0.5) * 4.2;
      values[i * 3 + 2] = Math.sin(angle) * radius * 8.4 - depth * 8;
    }
    return values;
  }, []);
  const ribbons = useMemo(
    () =>
      Array.from({ length: 7 }, (_, ribbonIndex) => {
        const points = Array.from({ length: 9 }, (_, pointIndex) => {
          const progress = pointIndex / 8;
          const angle = progress * Math.PI * 2 + ribbonIndex * 0.72;
          const radius = 1.1 + ribbonIndex * 0.35 + Math.sin(pointIndex * 1.7 + ribbonIndex) * 0.18;
          return new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(progress * Math.PI * 2.0 + ribbonIndex * 0.9) * (0.5 + ribbonIndex * 0.07),
            -progress * 7.2 + Math.sin(angle * 1.4) * 0.85
          );
        });
        return new THREE.CatmullRomCurve3(points);
      }),
    []
  );

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y = time * (0.025 + energy * 0.055 + sceneIntensity * 0.035);
      points.current.rotation.x = Math.sin(time * 0.18) * 0.14 + features.vocalStem * 0.06;
      const scale = 0.92 + weight * 0.08 + features.kick * 0.32 + features.bassStem * 0.24;
      points.current.scale.setScalar(scale);
    }
    if (material.current) {
      material.current.size = (0.018 + features.bassStem * 0.1 + features.kick * 0.09 + features.hihat * 0.035) * (0.75 + weight * 0.35);
      material.current.opacity = weight * (0.28 + energy * 0.34 + features.hihat * 0.24);
      material.current.color = new THREE.Color(config.effects.particleExplosions && features.snare > 0.45 ? palette.accent : palette.primary);
    }
    if (vocalRing.current) {
      vocalRing.current.scale.setScalar(1 + features.vocalStem * 0.75 + Math.sin(time * 2.4) * 0.04);
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
    if (ribbonGroup.current) {
      ribbonGroup.current.rotation.y = time * (0.08 + sceneIntensity * 0.06);
      ribbonGroup.current.rotation.z = Math.sin(time * 0.21) * 0.16 + features.vocalStem * 0.08;
      ribbonGroup.current.scale.setScalar(0.92 + energy * 0.14 + features.kick * 0.08);
    }
    if (sheetGroup.current) {
      sheetGroup.current.rotation.y = Math.sin(time * 0.13) * 0.28;
      sheetGroup.current.position.z = Math.sin(time * 0.2) * 0.42 - features.kick * 0.28;
    }
  });

  if (weight <= 0.01) return null;

  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={palette.primary} size={0.045} />
      </points>
      <group ref={sheetGroup}>
        {Array.from({ length: 6 }, (_, index) => {
          const y = -1.15 + index * 0.48 + Math.sin(time * 0.6 + index) * 0.08;
          const z = -1.2 - index * 0.8;
          return (
            <mesh key={`sheet-${index}`} position={[0, y, z]} rotation={[0, 0, -0.12 + index * 0.04]}>
              <planeGeometry args={[7.5 - index * 0.38, 0.045 + features.vocalStem * 0.035]} />
              <meshBasicMaterial
                color={index % 2 ? palette.secondary : palette.primary}
                transparent
                opacity={weight * (0.08 + features.vocalStem * 0.22 + sceneIntensity * 0.04)}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
      <group ref={ribbonGroup}>
        {ribbons.map((curve, index) => (
          <mesh key={`ribbon-${index}`}>
            <tubeGeometry args={[curve, 96, 0.018 + index * 0.002 + features.vocalStem * 0.01, 8, false]} />
            <meshBasicMaterial
              color={index % 3 === 0 ? palette.primary : index % 3 === 1 ? palette.secondary : palette.accent}
              transparent
              opacity={weight * (0.16 + energy * 0.2 + features.vocalStem * 0.22)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <mesh ref={vocalRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.018 + features.vocalStem * 0.035, 12, 160]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={weight * (0.16 + features.vocalStem * 0.42)} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={kickRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.45, 0.028, 8, 128]} />
        <meshBasicMaterial color={palette.primary} transparent opacity={weight * 0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={snareRing} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <torusGeometry args={[3.2, 0.014, 6, 96]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={weight * 0.12} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={sparkGroup}>
        {Array.from({ length: 36 }, (_, index) => {
          const angle = (index / 36) * Math.PI * 2;
          const radius = 2.2 + (index % 5) * 0.45;
          return (
            <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle * 2.1) * 1.2, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.018 + features.hihat * 0.05, 8, 8]} />
              <meshBasicMaterial color={index % 2 ? palette.highlight : palette.muted} transparent opacity={weight * (0.2 + features.hihat * 0.6)} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
