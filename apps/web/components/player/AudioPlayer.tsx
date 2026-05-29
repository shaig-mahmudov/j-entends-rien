"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { createAudioMeter, readFrequencyBands, type AudioMeter } from "@/lib/audio";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

type Props = {
  src: string | null;
};

export function AudioPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const meterRef = useRef<AudioMeter | null>(null);
  const frameRef = useRef<number | null>(null);
  const { isPlaying, setCurrentTime, setIsPlaying, setRealtimeBands } = useAppStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      if (meterRef.current) setRealtimeBands(readFrequencyBands(meterRef.current));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [setCurrentTime, setRealtimeBands]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (!meterRef.current) meterRef.current = createAudioMeter(audio);
    await meterRef.current.context.resume();
    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className="glass-panel grid gap-3 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Button onClick={toggle} disabled={!src} icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <audio
          ref={audioRef}
          src={src ?? undefined}
          controls
          crossOrigin="anonymous"
          className="h-10 flex-1"
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        />
      </div>
      {!src ? <p className="text-xs text-white/48">Upload audio on the create page, or reopen a saved project with stored audio.</p> : null}
    </div>
  );
}
