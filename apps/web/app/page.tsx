"use client";

import { ArrowRight, Radio, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { YouTubeInput } from "@/components/youtube/YouTubeInput";
import { createProject } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(preview: { youtubeUrl: string; youtubeTitle?: string | null; youtubeThumbnailUrl?: string | null }) {
    setBusy(true);
    setError(null);
    try {
      const result = await createProject(preview);
      router.push(`/create?projectId=${result.projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-8">
          <nav className="flex items-center gap-3 text-sm font-semibold text-white/68">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-cyanGlow text-ink shadow-glow">
              <Radio className="h-5 w-5" />
            </span>
            j-entends-rien
          </nav>

          <div className="grid gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase text-cyanGlow">
              <WandSparkles className="h-3.5 w-3.5" />
              AI visual director
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] text-white sm:text-7xl">j-entends-rien</h1>
            <p className="max-w-xl text-xl text-white/68">Turn music into living visuals.</p>
          </div>

          <div className="glass-panel grid gap-4 rounded-lg p-5 shadow-violet">
            <YouTubeInput onSubmit={handleCreate} busy={busy} />
            {error ? <p className="rounded-md border border-roseGlow/30 bg-roseGlow/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
            <p className="text-xs text-white/44">YouTube is used only for metadata preview. Upload audio manually on the next step.</p>
          </div>

          <Button variant="ghost" className="w-fit px-0 text-white/72" onClick={() => router.push("/create")} icon={<ArrowRight className="h-4 w-4" />}>
            Continue with a blank project
          </Button>
        </div>

        <div className="min-h-[480px]">
          <VisualizerCanvas compact preset="neon_tunnel" />
        </div>
      </section>
    </main>
  );
}
