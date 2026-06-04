"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { clamp, easeInOutSine, lerp, organicNoise, type ReactiveState, type SceneBlend } from "@/lib/visualEngine";

type Props = ReactiveState & {
  time: number;
  blend: SceneBlend;
};

type Shot = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  roll: number;
  fov: number;
};

export function CinematicCamera({ time, energy, beatPulse, bands, features, blend }: Props) {
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      particle: makeShot(),
      waveform: makeShot(),
      tunnel: makeShot()
    }),
    []
  );

  useFrame(({ camera }) => {
    const localTime = Math.max(0, time - blend.active.start);
    const shotTime = localTime / 9.5;
    const shotIndex = Math.floor(shotTime);
    const shotPhase = shotTime - shotIndex;
    const eased = easeInOutSine(shotPhase);
    const beatDolly = features.kick * 0.95 + beatPulse * 0.32;
    const intensity = clamp(blend.active.intensity * 0.75 + energy * 0.5, 0, 1.35);

    particleShot(scratch.particle, time, shotIndex, eased, energy, intensity, beatDolly, features.vocalStem);
    waveformShot(scratch.waveform, time, shotIndex, eased, energy, intensity, beatDolly, features.snare, bands.mid);
    tunnelShot(scratch.tunnel, time, shotIndex, eased, energy, intensity, beatDolly, features.snare, features.vocalStem);

    scratch.position.set(0, 0, 0);
    scratch.target.set(0, 0, 0);
    scratch.position.addScaledVector(scratch.particle.position, blend.weights.particle_field);
    scratch.position.addScaledVector(scratch.waveform.position, blend.weights.waveform_landscape);
    scratch.position.addScaledVector(scratch.tunnel.position, blend.weights.neon_tunnel);
    scratch.target.addScaledVector(scratch.particle.target, blend.weights.particle_field);
    scratch.target.addScaledVector(scratch.waveform.target, blend.weights.waveform_landscape);
    scratch.target.addScaledVector(scratch.tunnel.target, blend.weights.neon_tunnel);

    const shake = 0.035 + intensity * 0.045 + features.hihat * 0.055;
    scratch.position.x += organicNoise(time * 0.8, 1.7) * shake + features.snare * 0.08;
    scratch.position.y += organicNoise(time * 0.7, 3.2) * shake + features.vocalStem * 0.08;
    scratch.position.z -= features.kick * (0.34 + blend.weights.neon_tunnel * 0.68);

    camera.position.lerp(scratch.position, 0.08 + beatPulse * 0.035);
    camera.lookAt(scratch.target);
    camera.rotation.z +=
      scratch.particle.roll * blend.weights.particle_field +
      scratch.waveform.roll * blend.weights.waveform_landscape +
      scratch.tunnel.roll * blend.weights.neon_tunnel;

    if ("fov" in camera) {
      const perspective = camera as THREE.PerspectiveCamera;
      const targetFov =
        scratch.particle.fov * blend.weights.particle_field +
        scratch.waveform.fov * blend.weights.waveform_landscape +
        scratch.tunnel.fov * blend.weights.neon_tunnel;
      perspective.fov = lerp(perspective.fov, targetFov + features.kick * 2.2, 0.05);
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}

function makeShot(): Shot {
  return {
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    roll: 0,
    fov: 58
  };
}

function particleShot(shot: Shot, time: number, index: number, eased: number, energy: number, intensity: number, beatDolly: number, vocal: number) {
  const mode = index % 4;
  if (mode === 0) {
    shot.position.set(Math.sin(time * 0.29) * 3.7, 1.1 + Math.cos(time * 0.17) * 0.8 + vocal * 0.5, 7.4 + Math.cos(time * 0.13) * 1.1 - beatDolly * 0.35);
    shot.target.set(Math.sin(time * 0.18) * 0.45, 0.05 + vocal * 0.3, -1.8);
    shot.roll = Math.sin(time * 0.21) * 0.045;
    shot.fov = 56 + energy * 4;
  } else if (mode === 1) {
    shot.position.set(lerp(-2.4, 2.2, eased), -0.15 + vocal * 0.55, 4.7 - beatDolly * 0.5);
    shot.target.set(Math.sin(time * 0.42) * 0.4, 0.6, -2.8);
    shot.roll = -0.06 + eased * 0.12;
    shot.fov = 50 + intensity * 5;
  } else if (mode === 2) {
    shot.position.set(Math.cos(time * 0.19) * 1.4, 3.4 + energy * 0.9, 6.1 - beatDolly * 0.3);
    shot.target.set(0, -0.25, -2.6);
    shot.roll = Math.sin(time * 0.16) * 0.035;
    shot.fov = 62 - intensity * 4;
  } else {
    shot.position.set(Math.sin(time * 0.16) * 4.4, 0.8 + Math.sin(time * 0.31) * 0.9, 8.1 - beatDolly * 0.45);
    shot.target.set(Math.sin(time * 0.27) * 0.9, Math.cos(time * 0.22) * 0.45, -3.3);
    shot.roll = Math.sin(time * 0.37) * 0.09;
    shot.fov = 60 + energy * 5;
  }
}

function waveformShot(shot: Shot, time: number, index: number, eased: number, energy: number, intensity: number, beatDolly: number, snare: number, mid: number) {
  const mode = index % 4;
  if (mode === 0) {
    shot.position.set(Math.sin(time * 0.16) * 1.15, 1.35 + energy * 1.45, 6.0 - beatDolly * 0.45);
    shot.target.set(0, -0.82, -2.2);
    shot.roll = Math.sin(time * 0.18) * 0.025;
    shot.fov = 54 + mid * 6;
  } else if (mode === 1) {
    shot.position.set(lerp(3.7, -2.6, eased), 1.55 + snare * 0.35, 4.6 + Math.sin(time * 0.2) * 0.5);
    shot.target.set(0, -0.92, -1.4);
    shot.roll = -0.055 + eased * 0.08;
    shot.fov = 48 + intensity * 4;
  } else if (mode === 2) {
    shot.position.set(Math.sin(time * 0.21) * 0.85, 4.45 + energy * 0.45, 3.4 - beatDolly * 0.25);
    shot.target.set(0, -1.15, -2.2);
    shot.roll = Math.sin(time * 0.12) * 0.02;
    shot.fov = 63 - energy * 4;
  } else {
    shot.position.set(-2.6 + Math.sin(time * 0.33) * 1.0, 1.8 + energy * 0.7, 5.3 - beatDolly * 0.36);
    shot.target.set(0.7 * Math.sin(time * 0.25), -0.65, -2.8);
    shot.roll = Math.sin(time * 0.3) * 0.055;
    shot.fov = 52 + snare * 5;
  }
}

function tunnelShot(shot: Shot, time: number, index: number, eased: number, energy: number, intensity: number, beatDolly: number, snare: number, vocal: number) {
  const mode = index % 4;
  if (mode === 0) {
    shot.position.set(Math.sin(time * 0.72) * 0.28 + snare * 0.12, 0.55 + vocal * 0.42, 5.1 - beatDolly * 1.15);
    shot.target.set(0, 0.02, -7.2);
    shot.roll = Math.sin(time * 0.5) * 0.06;
    shot.fov = 64 + intensity * 6;
  } else if (mode === 1) {
    shot.position.set(Math.sin(time * 0.23) * 1.8, 1.0 + Math.cos(time * 0.29) * 0.55 + vocal * 0.25, 4.7 - beatDolly * 0.85);
    shot.target.set(Math.sin(time * 0.35) * 0.45, 0, -6.4);
    shot.roll = -0.11 + eased * 0.2;
    shot.fov = 58 + energy * 8;
  } else if (mode === 2) {
    shot.position.set(Math.sin(time * 0.38) * 0.55, -0.35 + vocal * 0.3, 4.35 - beatDolly * 0.9);
    shot.target.set(0, 0.45, -8.2);
    shot.roll = Math.sin(time * 0.64) * 0.12;
    shot.fov = 70 + intensity * 4;
  } else {
    shot.position.set(Math.cos(time * 0.24) * 1.2, Math.sin(time * 0.19) * 0.85, 4.3 - beatDolly);
    shot.target.set(Math.sin(time * 0.41) * 0.8, Math.cos(time * 0.31) * 0.38, -8.0);
    shot.roll = Math.sin(time * 0.27) * 0.14;
    shot.fov = 61 + energy * 7;
  }
}
