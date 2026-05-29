import type { AudioAnalysis } from "./audio";
import type { VisualConfig } from "./visual";

export type RenderStatus = "queued" | "rendering" | "completed" | "failed";

export type Render = {
  id: string;
  status: RenderStatus;
  outputUrl?: string | null;
  errorMessage?: string | null;
};

export type ProjectStatus = "created" | "uploaded" | "analyzing" | "analyzed" | "ready" | "rendering";

export type Project = {
  id: string;
  youtubeUrl: string;
  youtubeTitle?: string | null;
  youtubeThumbnailUrl?: string | null;
  youtubeDuration?: number | null;
  status: ProjectStatus;
  audioAnalysis?: AudioAnalysis | null;
  visualConfig?: VisualConfig | null;
  renders: Render[];
  createdAt?: string;
  updatedAt?: string;
};
