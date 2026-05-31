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
};

export type AudioAnalysis = {
  bpm: number;
  duration: number;
  beats: number[];
  energyCurve: EnergyPoint[];
  frequencyBands: FrequencyBandPoint[];
  reactiveFeatures?: ReactiveFeaturePoint[];
  sections: AudioSection[];
  source?: "uploaded_audio" | "estimated_from_metadata";
};
