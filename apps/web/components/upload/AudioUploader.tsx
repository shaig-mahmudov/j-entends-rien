"use client";

import { Upload } from "lucide-react";

type Props = {
  onFile: (file: File) => void;
  fileName?: string | null;
  disabled?: boolean;
};

export function AudioUploader({ onFile, fileName, disabled }: Props) {
  return (
    <label className="focus-ring grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-white/18 bg-white/[0.04] p-6 text-center transition hover:border-cyanGlow/60 hover:bg-cyanGlow/8">
      <input
        type="file"
        accept="audio/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <span className="flex flex-col items-center gap-3 text-sm text-white/62">
        <Upload className="h-6 w-6 text-cyanGlow" />
        <span className="font-semibold text-white">{fileName || "Upload an audio file"}</span>
        <span>MP3, WAV, M4A, or FLAC. Audio is never pulled from YouTube.</span>
      </span>
    </label>
  );
}
