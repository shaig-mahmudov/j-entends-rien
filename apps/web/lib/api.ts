import type { Project } from "@/types/project";
import type { VisualConfig } from "@/types/visual";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type CreateProjectPayload = {
  youtubeUrl: string;
  youtubeTitle?: string | null;
  youtubeThumbnailUrl?: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function absoluteApiUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

export async function createProject(payload: CreateProjectPayload): Promise<{ projectId: string; status: string }> {
  return request("/projects", { method: "POST", body: JSON.stringify(payload) });
}

export async function getProject(projectId: string): Promise<Project & { audioUrl?: string | null }> {
  return request(`/projects/${projectId}`);
}

export async function uploadAudio(projectId: string, file: File): Promise<{ audioFileId: string; status: string; audioUrl?: string }> {
  const form = new FormData();
  form.append("file", file);
  return request(`/projects/${projectId}/audio`, { method: "POST", body: form });
}

export async function analyzeProject(projectId: string) {
  return request<{ jobId: string; status: string; audioAnalysis: Project["audioAnalysis"] }>(`/projects/${projectId}/analyze`, {
    method: "POST"
  });
}

export async function createInstantVisual(
  projectId: string,
  payload: { lyrics?: string; stylePreference?: string }
): Promise<{ jobId: string; status: string; audioAnalysis: Project["audioAnalysis"]; visualConfig: VisualConfig }> {
  return request(`/projects/${projectId}/instant-visual`, { method: "POST", body: JSON.stringify(payload) });
}

export async function generateVisualConfig(
  projectId: string,
  payload: { lyrics?: string; stylePreference?: string }
): Promise<{ visualConfig: VisualConfig }> {
  return request(`/projects/${projectId}/visual-config`, { method: "POST", body: JSON.stringify(payload) });
}

export async function saveProject(projectId: string, visualConfig: VisualConfig) {
  return request<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ visualConfig, status: "ready" })
  });
}

export async function startRender(projectId: string): Promise<{ renderId: string; status: string }> {
  return request(`/projects/${projectId}/render`, { method: "POST" });
}
