import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ParticleScene } from "../scenes/ParticleScene";
import { TunnelScene } from "../scenes/TunnelScene";
import { LyricsScene } from "../scenes/LyricsScene";

export function MusicVisual({ projectId }: { projectId: string }) {
  const frame = useCurrentFrame();
  const intensity = interpolate(Math.sin(frame / 18), [-1, 1], [0.25, 1]);

  return (
    <AbsoluteFill style={{ background: "#050508", overflow: "hidden" }}>
      {frame < 300 ? <ParticleScene intensity={intensity} /> : <TunnelScene intensity={intensity} />}
      <LyricsScene projectId={projectId} frame={frame} />
    </AbsoluteFill>
  );
}
