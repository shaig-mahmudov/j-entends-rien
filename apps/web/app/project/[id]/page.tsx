"use client";

import { Download, Loader2, Save, SlidersHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { LinkedPlayback } from "@/components/player/LinkedPlayback";
import { Button } from "@/components/ui/Button";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { absoluteApiUrl, getProject, saveProject, startRender } from "@/lib/api";
import { type PresetSelection, useAppStore } from "@/lib/store";

const presets: { id: PresetSelection; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "particle_field", label: "Particle Field" },
  { id: "neon_tunnel", label: "Neon Tunnel" },
  { id: "waveform_landscape", label: "Waveform Landscape" }
];

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const { project, audioUrl, selectedPreset, setProject, setAudioUrl, setSelectedPreset } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getProject(params.id).then((loaded) => {
      setProject(loaded);
      setAudioUrl(absoluteApiUrl(loaded.audioUrl));
    });
  }, [params.id, setAudioUrl, setProject]);

  async function handleSave() {
    if (!project?.visualConfig) return;
    setBusy(true);
    const saved = await saveProject(params.id, project.visualConfig);
    setProject(saved);
    setMessage("Project saved.");
    setBusy(false);
  }

  async function handleRender() {
    setBusy(true);
    const render = await startRender(params.id);
    setMessage(`Render ${render.status}.`);
    const loaded = await getProject(params.id);
    setProject(loaded);
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen gap-5 px-5 py-6 xl:grid-cols-[1fr_390px]">
      <section className="grid gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyanGlow">Project</p>
            <h1 className="text-2xl font-black text-white">{project?.youtubeTitle || "Reactive visual preview"}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleSave} disabled={busy || !project?.visualConfig} icon={<Save className="h-4 w-4" />}>
              Save
            </Button>
            <Button variant="secondary" onClick={handleRender} disabled={busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}>
              Export MP4
            </Button>
          </div>
        </header>

        <VisualizerCanvas />
        {audioUrl ? <AudioPlayer src={audioUrl} /> : <LinkedPlayback project={project} />}
      </section>

      <aside className="grid h-fit gap-4">
        <div className="glass-panel grid gap-3 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-cyanGlow" />
            Visual preset
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className={`focus-ring min-h-11 rounded-md border px-2 text-xs font-semibold transition ${
                  selectedPreset === preset.id ? "border-cyanGlow bg-cyanGlow text-ink" : "border-white/12 bg-white/7 text-white/68 hover:bg-white/12"
                }`}
                onClick={() => setSelectedPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel grid gap-3 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-white">Analysis</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="BPM" value={project?.audioAnalysis?.bpm ?? "Demo"} />
            <Metric label="Beats" value={project?.audioAnalysis?.beats?.length ?? "Demo"} />
            <Metric label="Source" value={project?.audioAnalysis?.source === "estimated_from_metadata" ? "Estimated" : project?.status ?? "loading"} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Metric label="Quality" value={project?.audioAnalysis?.analysisQuality ?? "Demo"} />
            <Metric label="Stems" value={project?.audioAnalysis?.stemSeparation?.status ?? "none"} />
          </div>
        </div>

        <div className="glass-panel grid gap-3 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-white">AI visual config</h2>
          <pre className="max-h-[420px] overflow-auto rounded-md bg-black/42 p-3 text-xs leading-relaxed text-white/68">
            {JSON.stringify(project?.visualConfig ?? {}, null, 2)}
          </pre>
        </div>

        {message ? <div className="rounded-md border border-cyanGlow/30 bg-cyanGlow/10 p-3 text-sm text-cyan-50">{message}</div> : null}
      </aside>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-xs uppercase text-white/42">{label}</div>
    </div>
  );
}
