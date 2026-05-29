export type AudioMeter = {
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
  source: MediaElementAudioSourceNode;
  context: AudioContext;
};

export function createAudioMeter(audio: HTMLAudioElement): AudioMeter {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextCtor();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.78;
  const source = context.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(context.destination);
  const data = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  return { analyser, data, source, context };
}

export function readFrequencyBands(meter: AudioMeter): { bass: number; mid: number; treble: number } {
  meter.analyser.getByteFrequencyData(meter.data);
  const values = Array.from(meter.data);
  const average = (start: number, end: number) => {
    const slice = values.slice(start, end);
    return slice.reduce((sum, value) => sum + value, 0) / Math.max(1, slice.length) / 255;
  };
  return {
    bass: average(0, 12),
    mid: average(12, 96),
    treble: average(96, values.length)
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
