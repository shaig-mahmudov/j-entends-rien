"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { RenderPalette } from "@/lib/visualEngine";

type Props = {
  time: number;
  energy: number;
  beatPulse: number;
  palette: RenderPalette;
  sceneIntensity: number;
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uBeat;
  uniform float uIntensity;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amp;
      p *= 2.04;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(1.7, 1.1);
    float radial = 1.0 - smoothstep(0.12, 1.0, length(p));
    float cloud = fbm(uv * 3.2 + vec2(uTime * 0.035, -uTime * 0.018));
    float cloudFine = fbm(uv * 8.0 + vec2(-uTime * 0.024, uTime * 0.04));
    float beam = pow(max(0.0, sin((uv.x * 11.0 + uv.y * 4.5) + uTime * 0.32)), 10.0);
    float flare = pow(max(0.0, 1.0 - distance(uv, vec2(0.72 + sin(uTime * 0.07) * 0.09, 0.28 + cos(uTime * 0.05) * 0.12)) * 3.2), 3.0);
    float horizon = smoothstep(0.48, 0.0, abs(uv.y - 0.42)) * (0.2 + uIntensity * 0.45);

    vec3 color = mix(uSecondary, uPrimary, radial + cloud * 0.28);
    color = mix(color, uAccent, beam * 0.55 + flare * 0.65 + uBeat * 0.08);
    float alpha = (0.24 + uEnergy * 0.28 + uIntensity * 0.2) * (radial * 0.75 + cloud * 0.28 + cloudFine * 0.12 + beam * 0.18 + flare * 0.28 + horizon);
    gl_FragColor = vec4(color * (0.8 + alpha * 1.7), clamp(alpha, 0.0, 0.82));
  }
`;

export function CinematicBackdrop({ time, energy, beatPulse, palette, sceneIntensity }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uBeat: { value: 0 },
      uIntensity: { value: 0 },
      uPrimary: { value: new THREE.Color("#22d3ee") },
      uSecondary: { value: new THREE.Color("#8b5cf6") },
      uAccent: { value: new THREE.Color("#fb7185") }
    }),
    []
  );

  useFrame(() => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = time;
    material.current.uniforms.uEnergy.value = energy;
    material.current.uniforms.uBeat.value = beatPulse;
    material.current.uniforms.uIntensity.value = sceneIntensity;
    material.current.uniforms.uPrimary.value.set(palette.primary);
    material.current.uniforms.uSecondary.value.set(palette.secondary);
    material.current.uniforms.uAccent.value.set(palette.accent);
  });

  return (
    <mesh position={[0, 0, -14]} renderOrder={-20}>
      <planeGeometry args={[34, 19]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
