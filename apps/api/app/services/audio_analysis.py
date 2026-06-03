import math
import os
import wave
from pathlib import Path

from app.services.stem_separation import STEM_NAMES, separate_stems


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

    if os.getenv("AUDIO_ANALYSIS_MODE", "studio").lower() == "fast":
        stem_result = None
        stems = {}
        events = []
        reactive_features = _build_basic_reactive_features(times[::band_stride], frequency_bands, y, sr, hop_length)
        analysis_quality = "fast"
    else:
        stem_result = separate_stems(path)
        stems = _analyze_stems(path, y, sr, hop_length, duration, stem_result)
        events = _build_events(stems, beats)
        reactive_features = _build_reactive_features(times[::band_stride], frequency_bands, stems, events)
        analysis_quality = "studio" if stem_result.status == "ready" else "enhanced"
    downbeats = [beat for index, beat in enumerate(beats) if index % 4 == 0]

    return {
        "bpm": round(bpm, 2),
        "duration": round(duration, 2),
        "beats": beats[:1000],
        "downbeats": downbeats[:250],
        "energyCurve": energy,
        "frequencyBands": frequency_bands,
        "reactiveFeatures": reactive_features,
        "sections": _build_sections(duration, energy),
        "stems": stems,
        "events": events[:2000],
        "analysisQuality": analysis_quality,
        "stemSeparation": {
            "method": stem_result.method if stem_result else "disabled",
            "status": stem_result.status if stem_result else "skipped",
            "availableStems": sorted(stem_result.stems.keys()) if stem_result else [],
            "error": stem_result.error if stem_result else None,
        },
    }


def _build_basic_reactive_features(times, frequency_bands: list[dict], y, sr: int, hop_length: int) -> list[dict]:
    import librosa

    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    stride = max(1, int(len(onset_env) / max(1, len(frequency_bands))))
    onset_values = _normalize([float(v) for v in onset_env[::stride]])
    features = []
    for time, onset, band in zip(times, onset_values, frequency_bands, strict=False):
        kick = min(1.0, onset * (0.55 + band["bass"] * 0.7))
        snare = min(1.0, onset * (0.35 + band["mid"] * 0.7))
        hihat = min(1.0, onset * (0.25 + band["treble"] * 0.85))
        vocal = min(1.0, band["mid"] * 0.82 + band["treble"] * 0.18)
        drums = min(1.0, max(kick, snare) * 0.85 + hihat * 0.25)
        features.append(
            {
                "time": round(float(time), 2),
                "kick": round(kick, 4),
                "snare": round(snare, 4),
                "hihat": round(hihat, 4),
                "vocal": round(vocal, 4),
                "drums": round(drums, 4),
                "bassStem": round(band["bass"], 4),
                "vocalStem": round(vocal, 4),
                "otherStem": round(min(1.0, band["mid"] * 0.45 + band["treble"] * 0.25), 4),
            }
        )
    return features


def _analyze_stems(path: str, y, sr: int, hop_length: int, duration: float, stem_result) -> dict:
    import librosa

    if stem_result.stems:
        stems = {}
        for stem in STEM_NAMES:
            stem_path = stem_result.stems.get(stem)
            if not stem_path:
                continue
            stem_y, stem_sr = librosa.load(stem_path, sr=sr, mono=True)
            stems[stem] = _analyze_stem_signal(stem_y, stem_sr, hop_length, duration, stem)
        return stems

    pseudo_stems = _pseudo_stems(y, sr)
    return {
        name: _analyze_stem_signal(signal, sr, hop_length, duration, name)
        for name, signal in pseudo_stems.items()
    }


def _pseudo_stems(y, sr: int) -> dict:
    import librosa
    import numpy as np

    harmonic, percussive = librosa.effects.hpss(y)
    bass = _filter_signal(harmonic, sr, low=25, high=220)
    vocals = _filter_signal(harmonic, sr, low=180, high=4200)
    other = harmonic - (bass * 0.75 + vocals * 0.45)
    other = np.nan_to_num(other)
    return {
        "vocals": vocals,
        "drums": percussive,
        "bass": bass,
        "other": other,
    }


def _filter_signal(y, sr: int, *, low: float, high: float):
    from scipy import signal

    nyquist = sr / 2
    low_norm = max(0.001, low / nyquist)
    high_norm = min(0.999, high / nyquist)
    sos = signal.butter(6, [low_norm, high_norm], btype="bandpass", output="sos")
    return signal.sosfiltfilt(sos, y)


def _analyze_stem_signal(y, sr: int, hop_length: int, duration: float, stem: str) -> dict:
    import librosa
    import numpy as np

    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    times = librosa.frames_to_time(range(len(rms)), sr=sr, hop_length=hop_length)
    stride = max(1, int(len(rms) / max(1, min(240, math.ceil(duration)))))
    energy_values = _normalize([float(v) for v in rms[::stride]])
    energy_curve = [
        {"time": round(float(time), 2), "value": value}
        for time, value in zip(times[::stride], energy_values, strict=False)
    ]

    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop_length, backtrack=True)
    onset_values = _normalize([float(onset_env[frame]) for frame in onset_frames if frame < len(onset_env)])
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
    onsets = [
        {"time": round(float(time), 3), "intensity": intensity}
        for time, intensity in zip(onset_times, onset_values, strict=False)
        if intensity > 0.18
    ][:500]

    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]
    centroid_values = _normalize([float(v) for v in spectral_centroid[::stride]])
    centroid_curve = [
        {"time": round(float(time), 2), "value": value}
        for time, value in zip(times[::stride], centroid_values, strict=False)
    ]

    peak_moments = _local_peaks(energy_curve, threshold=0.62 if stem != "vocals" else 0.48)
    return {
        "energyCurve": energy_curve,
        "onsets": onsets,
        "peakMoments": peak_moments[:250],
        "spectralCentroidCurve": centroid_curve,
        "averageEnergy": round(float(np.mean(rms)) / (float(np.max(rms)) or 1.0), 4) if len(rms) else 0.0,
    }


def _local_peaks(points: list[dict], threshold: float) -> list[dict]:
    peaks = []
    for index in range(1, len(points) - 1):
        value = points[index]["value"]
        if value >= threshold and value >= points[index - 1]["value"] and value >= points[index + 1]["value"]:
            peaks.append({"time": points[index]["time"], "intensity": value})
    return peaks


def _build_events(stems: dict, beats: list[float]) -> list[dict]:
    events = []
    drums = stems.get("drums", {})
    bass = stems.get("bass", {})
    vocals = stems.get("vocals", {})
    for onset in drums.get("onsets", []):
        centroid = _sample_curve(drums.get("spectralCentroidCurve", []), onset["time"], "value")
        event_type = "kick" if centroid < 0.36 else "hihat" if centroid > 0.68 else "snare"
        events.append({"time": onset["time"], "type": event_type, "stem": "drums", "intensity": onset["intensity"]})
    for peak in bass.get("peakMoments", []):
        events.append({"time": peak["time"], "type": "bass_hit", "stem": "bass", "intensity": peak["intensity"]})
    for peak in vocals.get("peakMoments", []):
        events.append({"time": peak["time"], "type": "vocal_peak", "stem": "vocals", "intensity": peak["intensity"]})
    for index, beat in enumerate(beats[:500]):
        events.append({"time": beat, "type": "downbeat" if index % 4 == 0 else "beat", "stem": "mix", "intensity": 1.0 if index % 4 == 0 else 0.55})
    return sorted(events, key=lambda item: item["time"])


def _build_reactive_features(times, frequency_bands: list[dict], stems: dict, events: list[dict]) -> list[dict]:
    features = []
    for time, band in zip(times, frequency_bands, strict=False):
        t = float(time)
        kick = _event_proximity(events, t, "kick", width=0.12)
        snare = _event_proximity(events, t, "snare", width=0.14)
        hihat = _event_proximity(events, t, "hihat", width=0.08)
        bass_hit = _event_proximity(events, t, "bass_hit", width=0.18)
        vocal_peak = _event_proximity(events, t, "vocal_peak", width=0.28)
        bass_energy = _stem_energy(stems, "bass", t)
        drums_energy = _stem_energy(stems, "drums", t)
        vocal_energy = _stem_energy(stems, "vocals", t)
        other_energy = _stem_energy(stems, "other", t)
        features.append(
            {
                "time": round(t, 2),
                "kick": round(max(kick, bass_energy * band["bass"] * 0.8), 4),
                "snare": round(max(snare, drums_energy * band["mid"] * 0.65), 4),
                "hihat": round(max(hihat, band["treble"] * 0.55), 4),
                "vocal": round(max(vocal_peak, vocal_energy), 4),
                "drums": round(max(kick, snare, hihat, drums_energy), 4),
                "bassStem": round(max(bass_energy, bass_hit), 4),
                "vocalStem": round(vocal_energy, 4),
                "otherStem": round(other_energy, 4),
            }
        )
    return features


def _stem_energy(stems: dict, stem: str, time: float) -> float:
    return _sample_curve(stems.get(stem, {}).get("energyCurve", []), time, "value")


def _sample_curve(points: list[dict], time: float, key: str) -> float:
    if not points:
        return 0.0
    nearest = min(points, key=lambda point: abs(float(point["time"]) - time))
    return float(nearest.get(key, 0.0))


def _event_proximity(events: list[dict], time: float, event_type: str, width: float) -> float:
    best = 0.0
    for event in events:
        if event.get("type") != event_type:
            continue
        distance = abs(float(event["time"]) - time)
        if distance <= width:
            best = max(best, (1 - distance / width) * float(event.get("intensity", 1.0)))
    return min(1.0, best)


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
        "downbeats": [beat for index, beat in enumerate(beats) if index % 4 == 0],
        "energyCurve": energy,
        "frequencyBands": frequency,
        "reactiveFeatures": reactive_features,
        "sections": _build_sections(duration, energy),
        "stems": {},
        "events": [],
        "analysisQuality": "fast",
        "stemSeparation": {
            "method": "wav_fallback",
            "status": "unavailable",
            "availableStems": [],
            "error": None,
        },
    }
