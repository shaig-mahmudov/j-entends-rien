import math
import wave
from pathlib import Path


def _normalize(values: list[float]) -> list[float]:
    if not values:
        return []
    maximum = max(values) or 1.0
    return [round(min(1.0, max(0.0, value / maximum)), 4) for value in values]


def _section_type(index: int, total: int) -> str:
    if index == 0:
        return "intro"
    if index == total - 1:
        return "outro"
    if index == max(1, total // 2):
        return "chorus_or_drop"
    return "verse"


def _build_sections(duration: float, energy: list[dict]) -> list[dict]:
    if duration <= 0:
        return []
    count = 4 if duration >= 48 else 3
    section_length = duration / count
    sections = []
    for index in range(count):
        start = round(index * section_length, 2)
        end = round(duration if index == count - 1 else (index + 1) * section_length, 2)
        samples = [p["value"] for p in energy if start <= p["time"] < end]
        intensity = round(sum(samples) / max(1, len(samples)), 3)
        sections.append(
            {
                "start": start,
                "end": end,
                "type": _section_type(index, count),
                "intensity": intensity,
            }
        )
    if sections:
        loudest = max(range(len(sections)), key=lambda i: sections[i]["intensity"])
        if 0 < loudest < len(sections) - 1:
            sections[loudest]["type"] = "chorus_or_drop"
    return sections


def analyze_audio_file(path: str) -> dict:
    try:
        return _analyze_with_librosa(path)
    except Exception:
        return _analyze_wav_fallback(path)


def _analyze_with_librosa(path: str) -> dict:
    import librosa
    import numpy as np

    y, sr = librosa.load(path, sr=22050, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.asarray(tempo).reshape(-1)[0]) if np.asarray(tempo).size else 0.0
    beats = [round(float(t), 3) for t in librosa.frames_to_time(beat_frames, sr=sr)]

    hop_length = 512
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    rms_times = librosa.frames_to_time(range(len(rms)), sr=sr, hop_length=hop_length)
    stride = max(1, int(len(rms) / max(1, min(240, math.ceil(duration)))))
    rms_values = _normalize([float(v) for v in rms[::stride]])
    energy = [
        {"time": round(float(t), 2), "value": value}
        for t, value in zip(rms_times[::stride], rms_values, strict=False)
    ]

    spectrum = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    times = librosa.frames_to_time(range(spectrum.shape[1]), sr=sr, hop_length=hop_length)
    band_stride = max(1, int(spectrum.shape[1] / max(1, min(240, math.ceil(duration)))))

    def band_mean(low: float, high: float) -> np.ndarray:
        mask = (freqs >= low) & (freqs < high)
        if not mask.any():
            return np.zeros(spectrum.shape[1])
        return spectrum[mask].mean(axis=0)

    bass = _normalize([float(v) for v in band_mean(20, 250)[::band_stride]])
    mid = _normalize([float(v) for v in band_mean(250, 4000)[::band_stride]])
    treble = _normalize([float(v) for v in band_mean(4000, 12000)[::band_stride]])
    frequency_bands = [
        {"time": round(float(time), 2), "bass": b, "mid": m, "treble": tr}
        for time, b, m, tr in zip(times[::band_stride], bass, mid, treble, strict=False)
    ]

    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    onset_values = _normalize([float(v) for v in onset_env[::band_stride]])
    reactive_features = []
    for time, onset, band in zip(times[::band_stride], onset_values, frequency_bands, strict=False):
        kick = min(1.0, onset * (0.55 + band["bass"] * 0.7))
        snare = min(1.0, onset * (0.35 + band["mid"] * 0.7))
        hihat = min(1.0, onset * (0.25 + band["treble"] * 0.85))
        vocal = min(1.0, band["mid"] * 0.82 + band["treble"] * 0.18)
        drums = min(1.0, max(kick, snare) * 0.85 + hihat * 0.25)
        reactive_features.append(
            {
                "time": round(float(time), 2),
                "kick": round(kick, 4),
                "snare": round(snare, 4),
                "hihat": round(hihat, 4),
                "vocal": round(vocal, 4),
                "drums": round(drums, 4),
            }
        )

    return {
        "bpm": round(bpm, 2),
        "duration": round(duration, 2),
        "beats": beats[:1000],
        "energyCurve": energy,
        "frequencyBands": frequency_bands,
        "reactiveFeatures": reactive_features,
        "sections": _build_sections(duration, energy),
    }


def _analyze_wav_fallback(path: str) -> dict:
    file_path = Path(path)
    with wave.open(str(file_path), "rb") as source:
        frame_rate = source.getframerate()
        frames = source.getnframes()
        duration = frames / float(frame_rate or 1)
        channels = source.getnchannels()
        sample_width = source.getsampwidth()
        window = max(1, frame_rate)
        energy_values = []
        for second in range(max(1, math.ceil(duration))):
            source.setpos(min(frames, second * window))
            data = source.readframes(min(window, max(0, frames - source.tell())))
            if not data:
                energy_values.append(0.0)
                continue
            step = max(1, sample_width * channels)
            samples = [int.from_bytes(data[i : i + sample_width], "little", signed=True) for i in range(0, len(data), step)]
            rms = math.sqrt(sum(sample * sample for sample in samples) / max(1, len(samples)))
            energy_values.append(rms)

    normalized = _normalize(energy_values)
    energy = [{"time": float(index), "value": value} for index, value in enumerate(normalized)]
    bpm = 120.0
    beat_gap = 60.0 / bpm
    beats = [round(index * beat_gap, 3) for index in range(int(duration / beat_gap))]
    frequency = [{"time": p["time"], "bass": p["value"], "mid": round(p["value"] * 0.7, 4), "treble": round(p["value"] * 0.45, 4)} for p in energy]
    reactive_features = [
        {
            "time": p["time"],
            "kick": p["value"],
            "snare": round(p["value"] * 0.7, 4),
            "hihat": round(p["value"] * 0.45, 4),
            "vocal": round(p["value"] * 0.55, 4),
            "drums": p["value"],
        }
        for p in energy
    ]
    return {
        "bpm": bpm,
        "duration": round(duration, 2),
        "beats": beats,
        "energyCurve": energy,
        "frequencyBands": frequency,
        "reactiveFeatures": reactive_features,
        "sections": _build_sections(duration, energy),
    }
