export type EnergyPoint = {
  time: number;
  value: number;
};

export type FrequencyBandPoint = {
  time: number;
  bass: number;
  mid: number;
  treble: number;
};

export type AudioSection = {
  start: number;
  end: number;
  type: "intro" | "verse" | "chorus_or_drop" | "bridge" | "outro";
  intensity: number;
};

export type ReactiveFeaturePoint = {
  time: number;
  kick: number;
  snare: number;
  hihat: number;
  vocal: number;
  drums: number;
  bassStem?: number;
  vocalStem?: number;
  otherStem?: number;
};

export type StemAnalysis = {
  energyCurve: EnergyPoint[];
  onsets: Array<{ time: number; intensity: number }>;
  peakMoments: Array<{ time: number; intensity: number }>;
  spectralCentroidCurve: EnergyPoint[];
  averageEnergy: number;
};

export type AudioEvent = {
  time: number;
  type: "beat" | "downbeat" | "kick" | "snare" | "hihat" | "bass_hit" | "vocal_peak";
  stem: "mix" | "drums" | "bass" | "vocals" | "other";
  intensity: number;
};

export type AudioAnalysis = {
  bpm: number;
  duration: number;
  beats: number[];
  downbeats?: number[];
  energyCurve: EnergyPoint[];
  frequencyBands: FrequencyBandPoint[];
  reactiveFeatures?: ReactiveFeaturePoint[];
  stems?: Partial<Record<"vocals" | "drums" | "bass" | "other", StemAnalysis>>;
  events?: AudioEvent[];
  analysisQuality?: "fast" | "enhanced" | "studio";
  stemSeparation?: {
    method: string;
    status: string;
    availableStems: string[];
    error?: string | null;
  };
  sections: AudioSection[];
  source?: "uploaded_audio" | "estimated_from_metadata";
};
