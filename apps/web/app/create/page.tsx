"use client";

import { Check, Loader2, WandSparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AudioUploader } from "@/components/upload/AudioUploader";
import { YouTubeInput } from "@/components/youtube/YouTubeInput";
import { YouTubePreviewCard } from "@/components/youtube/YouTubePreviewCard";
import { absoluteApiUrl, analyzeProject, createInstantVisual, createProject, generateVisualConfig, getProject, uploadAudio } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const styles = ["dark neon dreamy", "warm cinematic glow", "aggressive red strobe", "organic emerald haze"];

export default function CreatePage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-white">Loading create flow...</main>}>
      <CreatePageContent />
    </Suspense>
  );
}

function CreatePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const existingProjectId = params.get("projectId");
  const { project, setProject, setAudioUrl, setAnalysis, setVisualConfig } = useAppStore();
  const [projectId, setProjectId] = useState<string | null>(existingProjectId);
  const [file, setFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [stylePreference, setStylePreference] = useState(styles[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingProjectId) return;
    getProject(existingProjectId)
      .then((loaded) => {
        setProject(loaded);
        setAudioUrl(absoluteApiUrl(loaded.audioUrl));
      })
      .catch(() => undefined);
  }, [existingProjectId, setAudioUrl, setProject]);

  const canRunUpload = useMemo(() => Boolean(projectId && file), [projectId, file]);
  const canRunInstant = useMemo(() => Boolean(projectId), [projectId]);

  async function handleCreate(preview: { youtubeUrl: string; youtubeTitle?: string | null; youtubeThumbnailUrl?: string | null }) {
    setBusy(true);
    setError(null);
    try {
      const result = await createProject(preview);
      setProjectId(result.projectId);
      const loaded = await getProject(result.projectId);
      setProject(loaded);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    if (!projectId || !file) return;
    setBusy(true);
    setError(null);
    try {
      const upload = await uploadAudio(projectId, file);
      setAudioUrl(absoluteApiUrl(upload.audioUrl) ?? URL.createObjectURL(file));
      const analysis = await analyzeProject(projectId);
      if (analysis.audioAnalysis) setAnalysis(analysis.audioAnalysis);
      const visual = await generateVisualConfig(projectId, { lyrics, stylePreference });
      setVisualConfig(visual.visualConfig);
      const loaded = await getProject(projectId);
      setProject(loaded);
      router.push(`/project/${projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function runInstantVisual() {
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      const instant = await createInstantVisual(projectId, { lyrics, stylePreference });
      if (instant.audioAnalysis) setAnalysis(instant.audioAnalysis);
      setVisualConfig(instant.visualConfig);
      const loaded = await getProject(projectId);
      setProject(loaded);
      router.push(`/project/${projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Instant visual generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-5 py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-cyanGlow">Create</p>
          <h1 className="text-3xl font-black text-white">Build a reactive visual</h1>
        </div>
        <div className="text-sm text-white/50">Project {projectId ? "created" : "not created yet"}</div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <div className="glass-panel grid gap-4 rounded-lg p-5">
            <StepLabel done={Boolean(projectId)}>1. Paste YouTube or Spotify link</StepLabel>
            <YouTubeInput onSubmit={handleCreate} busy={busy} />
          </div>

          <div className="glass-panel grid gap-4 rounded-lg p-5">
            <StepLabel done={Boolean(file)}>2. Optional: improve sync with audio</StepLabel>
            <AudioUploader onFile={setFile} fileName={file?.name} disabled={!projectId || busy} />
          </div>

          <div className="glass-panel grid gap-4 rounded-lg p-5">
            <StepLabel done={Boolean(stylePreference)}>3. Visual style</StepLabel>
            <textarea
              className="focus-ring min-h-36 rounded-md border border-white/12 bg-black/34 p-4 text-sm text-white placeholder:text-white/34"
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              placeholder="Optional lyrics can wait. Add timestamped lyrics later if you want lyric-reactive cues."
            />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {styles.map((style) => (
                <button
                  key={style}
                  className={`focus-ring min-h-11 rounded-md border px-3 text-sm font-semibold transition ${
                    stylePreference === style ? "border-cyanGlow bg-cyanGlow text-ink" : "border-white/12 bg-white/7 text-white/72 hover:bg-white/12"
                  }`}
                  onClick={() => setStylePreference(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="rounded-md border border-roseGlow/30 bg-roseGlow/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button
              className="min-h-12"
              disabled={!canRunInstant || busy}
              onClick={runInstantVisual}
              icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            >
              Generate instant visuals
            </Button>
            <Button
              variant="secondary"
              className="min-h-12"
              disabled={!canRunUpload || busy}
              onClick={runAnalysis}
              icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            >
              Analyze uploaded audio
            </Button>
          </div>
        </div>

        <aside className="grid h-fit gap-5">
          <YouTubePreviewCard
            title={project?.youtubeTitle}
            thumbnailUrl={project?.youtubeThumbnailUrl}
            duration={project?.youtubeDuration}
            youtubeUrl={project?.youtubeUrl}
            provider={project?.sourceProvider}
          />
          <div className="glass-panel rounded-lg p-4 text-sm text-white/58">
            Instant visuals use metadata-estimated BPM and energy. Uploading audio remains optional for more accurate sync.
          </div>
        </aside>
      </section>
    </main>
  );
}

function StepLabel({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-white">
      <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-cyanGlow text-ink" : "bg-white/10 text-white/45"}`}>
        {done ? <Check className="h-3 w-3" /> : null}
      </span>
      {children}
    </div>
  );
}
