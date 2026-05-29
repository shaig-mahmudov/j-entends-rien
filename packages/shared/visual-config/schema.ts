import { z } from "zod";

export const visualSceneSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  sceneType: z.enum(["particle_field", "waveform_landscape", "neon_tunnel"]),
  description: z.string(),
  intensity: z.number().min(0).max(1)
});

export const visualConfigSchema = z.object({
  vibe: z.string(),
  mood: z.string(),
  colorPalette: z.array(z.string()).min(3),
  visualStyle: z.string(),
  cameraStyle: z.string(),
  effects: z.object({
    beatPulse: z.boolean(),
    bassDistortion: z.boolean(),
    lyricHighlights: z.boolean(),
    particleExplosions: z.boolean()
  }),
  scenes: z.array(visualSceneSchema).min(1),
  lyricsMoments: z.array(
    z.object({
      time: z.number().nonnegative(),
      text: z.string(),
      visualCue: z.string()
    })
  )
});

export type VisualConfigSchema = z.infer<typeof visualConfigSchema>;
