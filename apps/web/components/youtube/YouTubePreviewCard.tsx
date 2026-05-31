import { Clock3 } from "lucide-react";

type Props = {
  title?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  youtubeUrl?: string | null;
  provider?: string | null;
};

export function YouTubePreviewCard({ title, thumbnailUrl, duration, youtubeUrl, provider }: Props) {
  return (
    <div className="glass-panel overflow-hidden rounded-lg">
      <div className="aspect-video bg-black">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title || "Track artwork"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/42">Paste a music link for preview</div>
        )}
      </div>
      <div className="grid gap-2 p-4">
        <div className="line-clamp-2 min-h-10 text-sm font-semibold text-white">{title || "Metadata will appear after project creation"}</div>
        {provider ? <div className="text-xs uppercase text-cyanGlow/80">{provider.replace("_", " ")}</div> : null}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock3 className="h-3.5 w-3.5" />
          {duration ? `${Math.round(duration)} sec` : "Duration if available"}
        </div>
        {youtubeUrl ? <div className="truncate text-xs text-white/36">{youtubeUrl}</div> : null}
      </div>
    </div>
  );
}
