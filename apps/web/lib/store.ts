"use client";

import { create } from "zustand";
import type { AudioAnalysis } from "@/types/audio";
import type { Project } from "@/types/project";
import type { SceneType, VisualConfig } from "@/types/visual";

export type PresetSelection = "timeline" | SceneType;

type RealtimeBands = {
  bass: number;
  mid: number;
  treble: number;
};

type AppState = {
  project: Project | null;
  audioUrl: string | null;
  currentTime: number;
  isPlaying: boolean;
  selectedPreset: PresetSelection;
  realtimeBands: RealtimeBands;
  setProject: (project: Project | null) => void;
  setAudioUrl: (url: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedPreset: (preset: PresetSelection) => void;
  setRealtimeBands: (bands: RealtimeBands) => void;
  setAnalysis: (analysis: AudioAnalysis) => void;
  setVisualConfig: (config: VisualConfig) => void;
};

export const useAppStore = create<AppState>((set) => ({
  project: null,
  audioUrl: null,
  currentTime: 0,
  isPlaying: false,
  selectedPreset: "timeline",
  realtimeBands: { bass: 0, mid: 0, treble: 0 },
  setProject: (project) => set({ project }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSelectedPreset: (selectedPreset) => set({ selectedPreset }),
  setRealtimeBands: (realtimeBands) => set({ realtimeBands }),
  setAnalysis: (analysis) =>
    set((state) => ({
      project: state.project ? { ...state.project, audioAnalysis: analysis, status: "analyzed" } : state.project
    })),
  setVisualConfig: (config) =>
    set((state) => ({
      project: state.project ? { ...state.project, visualConfig: config, status: "ready" } : state.project
    }))
}));
