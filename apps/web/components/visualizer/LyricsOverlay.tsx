"use client";

import type { VisualConfig } from "@/types/visual";

type Props = {
  config: VisualConfig;
  time: number;
};

export function LyricsOverlay({ config, time }: Props) {
  const active = config.lyricsMoments.find((moment) => Math.abs(moment.time - time) < 2.2);
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-6">
      <div className="max-w-[82%] rounded-md border border-cyanGlow/30 bg-black/58 px-5 py-3 text-center shadow-glow">
        <div className="text-lg font-semibold text-white">{active.text}</div>
        <div className="mt-1 text-xs uppercase text-cyanGlow/80">{active.visualCue}</div>
      </div>
    </div>
  );
}
