"use client";

import { Link2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  initialUrl?: string;
  onSubmit: (preview: { youtubeUrl: string; youtubeTitle?: string | null; youtubeThumbnailUrl?: string | null }) => void;
  busy?: boolean;
};

export function YouTubeInput({ initialUrl = "", onSubmit, busy }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const preview = useMemo(() => buildPreview(url), [url]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!url.trim()) return;
        onSubmit({ youtubeUrl: url.trim(), youtubeTitle: preview.title, youtubeThumbnailUrl: preview.thumbnail });
      }}
    >
      <label className="text-xs font-semibold uppercase text-white/50">YouTube URL</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
          <input
            className="focus-ring min-h-12 w-full rounded-md border border-white/12 bg-black/34 px-10 text-sm text-white placeholder:text-white/34"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <Button type="submit" disabled={busy || !url.trim()} icon={<Sparkles className="h-4 w-4" />}>
          Create visual
        </Button>
      </div>
    </form>
  );
}

function buildPreview(url: string) {
  const id = extractVideoId(url);
  return {
    title: id ? "YouTube metadata preview" : null,
    thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
  };
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1) || null;
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    const match = parsed.pathname.match(/\/(?:shorts|embed)\/([^/?#]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
