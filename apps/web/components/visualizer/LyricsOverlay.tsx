"use client";

import { resolvePalette } from "@/lib/visualEngine";
import type { VisualConfig } from "@/types/visual";

type Props = {
  config: VisualConfig;
  time: number;
};

export function LyricsOverlay({ config, time }: Props) {
  const active = config.lyricsMoments.find((moment) => Math.abs(moment.time - time) < 2.4);
  if (!active) return null;
  const palette = resolvePalette(config);
  const distance = Math.abs(active.time - time);
  const progress = Math.max(0, 1 - distance / 2.4);
  const scale = 0.94 + progress * 0.08;
  const blur = Math.max(0, 1 - progress) * 10;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center px-6">
      <div
        className="max-w-[86%] text-center"
        style={{
          opacity: progress,
          transform: `translateY(${(1 - progress) * 18}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          transition: "opacity 120ms linear, transform 120ms linear, filter 120ms linear"
        }}
      >
        <div
          className="text-balance text-2xl font-black uppercase tracking-normal text-white sm:text-4xl"
          style={{
            textShadow: `0 0 16px ${palette.primary}, 0 0 42px ${palette.secondary}`
          }}
        >
          {active.text}
        </div>
        <div className="mx-auto mt-2 h-px max-w-72" style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)` }} />
        <div className="mt-2 text-xs font-semibold uppercase tracking-normal" style={{ color: palette.muted }}>
          {active.visualCue}
        </div>
      </div>
    </div>
  );
}
