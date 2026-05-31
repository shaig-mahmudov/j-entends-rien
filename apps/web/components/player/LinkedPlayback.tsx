"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import type { Project } from "@/types/project";

type Props = {
  project: Project | null;
};

export function LinkedPlayback({ project }: Props) {
  const provider = project?.sourceProvider;
  if (provider === "youtube" && project?.externalId) return <YouTubePlayback videoId={project.externalId} />;
  if (provider?.startsWith("spotify") && project?.youtubeUrl) return <SpotifyPlayback url={project.youtubeUrl} duration={project.youtubeDuration ?? project.audioAnalysis?.duration ?? 180} />;
  return <ManualSyncClock duration={project?.audioAnalysis?.duration ?? 180} label="Visual sync clock" />;
}

function YouTubePlayback({ videoId }: { videoId: string }) {
  const playerId = useMemo(() => `youtube-player-${videoId}`, [videoId]);
  const setCurrentTime = useAppStore((state) => state.setCurrentTime);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (player?.getCurrentTime) setCurrentTime(player.getCurrentTime());
    }, 250);

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => setIsPlaying(event.data === 1)
        }
      });
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      playerRef.current?.destroy?.();
    };
  }, [playerId, setCurrentTime, setIsPlaying, videoId]);

  return (
    <div className="glass-panel grid gap-3 rounded-lg p-4">
      <div className="text-sm font-semibold text-white">YouTube playback</div>
      <div className="aspect-video overflow-hidden rounded-md bg-black">
        <div id={playerId} className="h-full w-full" />
      </div>
      <p className="text-xs text-white/45">Audio plays through the official YouTube player. Visuals follow player time using the IFrame API.</p>
    </div>
  );
}

function SpotifyPlayback({ url, duration }: { url: string; duration: number }) {
  const embedUrl = toSpotifyEmbed(url);
  return (
    <div className="glass-panel grid gap-3 rounded-lg p-4">
      <div className="text-sm font-semibold text-white">Spotify playback</div>
      <iframe
        src={embedUrl}
        className="h-[152px] w-full rounded-md border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <ManualSyncClock duration={duration} label="Visual sync timer" />
      <p className="text-xs text-white/45">Spotify embeds do not expose raw audio or reliable realtime position, so this MVP uses a companion sync timer for visuals.</p>
    </div>
  );
}

function ManualSyncClock({ duration, label }: { duration: number; label: string }) {
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying } = useAppStore();
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      startedAtRef.current = null;
      return;
    }
    startedAtRef.current = performance.now() - currentTime * 1000;
    let frame = 0;
    const tick = () => {
      if (startedAtRef.current !== null) {
        const next = ((performance.now() - startedAtRef.current) / 1000) % Math.max(1, duration);
        setCurrentTime(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentTime, duration, isPlaying, setCurrentTime]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        onClick={() => setIsPlaying(!isPlaying)}
        icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      >
        {isPlaying ? "Pause visuals" : "Start visuals"}
      </Button>
      <input
        className="min-w-48 flex-1 accent-cyanGlow"
        type="range"
        min={0}
        max={Math.max(1, duration)}
        step={0.1}
        value={Math.min(currentTime, duration)}
        onChange={(event) => setCurrentTime(Number(event.target.value))}
        aria-label={label}
      />
      <div className="w-20 text-right text-xs text-white/50">{formatTime(currentTime)}</div>
    </div>
  );
}

function toSpotifyEmbed(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const typeIndex = parts.findIndex((part) => ["track", "album", "playlist"].includes(part));
    if (typeIndex >= 0 && parts[typeIndex + 1]) {
      return `https://open.spotify.com/embed/${parts[typeIndex]}/${parts[typeIndex + 1]}`;
    }
  } catch {
    return url;
  }
  return url;
}

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

type YTPlayer = {
  getCurrentTime: () => number;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        id: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onStateChange?: (event: { data: number }) => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
