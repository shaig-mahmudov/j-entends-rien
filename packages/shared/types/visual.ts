export type SceneType = "particle_field" | "waveform_landscape" | "neon_tunnel";

export type VisualScene = {
  start: number;
  end: number;
  sceneType: SceneType;
  description: string;
  intensity: number;
};

export type LyricsMoment = {
  time: number;
  text: string;
  visualCue: string;
};

export type VisualConfig = {
  vibe: string;
  mood: string;
  colorPalette: string[];
  visualStyle: string;
  cameraStyle: string;
  effects: {
    beatPulse: boolean;
    bassDistortion: boolean;
    lyricHighlights: boolean;
    particleExplosions: boolean;
  };
  scenes: VisualScene[];
  lyricsMoments: LyricsMoment[];
};
