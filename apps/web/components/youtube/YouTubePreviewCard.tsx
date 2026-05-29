import { Clock3 } from "lucide-react";

type Props = {
  title?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  youtubeUrl?: string | null;
};

export function YouTubePreviewCard({ title, thumbnailUrl, duration, youtubeUrl }: Props) {
  return (
    <div className="glass-panel overflow-hidden rounded-lg">
      <div className="aspect-video bg-black">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title || "YouTube video thumbnail"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/42">Paste a link for preview</div>
        )}
      </div>
      <div className="grid gap-2 p-4">
        <div className="line-clamp-2 min-h-10 text-sm font-semibold text-white">{title || "Metadata will appear after project creation"}</div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock3 className="h-3.5 w-3.5" />
          {duration ? `${Math.round(duration)} sec` : "Duration if available"}
        </div>
        {youtubeUrl ? <div className="truncate text-xs text-white/36">{youtubeUrl}</div> : null}
      </div>
    </div>
  );
}
