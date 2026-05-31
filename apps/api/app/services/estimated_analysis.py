import hashlib
import math


def estimate_audio_analysis(*, title: str | None, duration: float | None, style_preference: str | None = None) -> dict:
    seed_text = f"{title or ''}|{style_preference or ''}"
    seed = int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:8], 16)
    bpm = _estimate_bpm(seed, title or "", style_preference or "")
    track_duration = float(duration or _estimate_duration(seed))
    beat_gap = 60.0 / bpm
    beats = [round(index * beat_gap, 3) for index in range(max(1, int(track_duration / beat_gap)))]

    energy_curve = []
    frequency_bands = []
    reactive_features = []
    sample_count = max(30, min(240, int(math.ceil(track_duration))))
    for index in range(sample_count):
        time = round(index * track_duration / sample_count, 2)
        progress = index / max(1, sample_count - 1)
        section_boost = 0.22 if 0.52 <= progress <= 0.82 else 0.0
        wave = math.sin(progress * math.tau * 3 + seed % 11) * 0.16
        energy = _clamp(0.38 + section_boost + wave)
        bass = _clamp(energy * 0.82 + math.sin(progress * math.tau * 7) * 0.14)
        mid = _clamp(energy * 0.65 + math.cos(progress * math.tau * 5) * 0.12)
        treble = _clamp(energy * 0.5 + math.sin(progress * math.tau * 11) * 0.1)
        beat_phase = (time / beat_gap) % 1
        half_beat_phase = (time / (beat_gap / 2)) % 1
        kick = _pulse(beat_phase, 0.0, 0.08) * (0.65 + bass * 0.35)
        snare = _pulse(beat_phase, 0.5, 0.1) * (0.5 + mid * 0.5)
        hihat = _pulse(half_beat_phase, 0.0, 0.07) * (0.35 + treble * 0.65)
        vocal = _clamp(mid * (0.55 + math.sin(progress * math.tau * 2.2 + seed % 5) * 0.25) + energy * 0.18)
        drums = _clamp(max(kick, snare) * 0.85 + hihat * 0.25)
        energy_curve.append({"time": time, "value": round(energy, 4)})
        frequency_bands.append({"time": time, "bass": round(bass, 4), "mid": round(mid, 4), "treble": round(treble, 4)})
        reactive_features.append(
            {
                "time": time,
                "kick": round(_clamp(kick), 4),
                "snare": round(_clamp(snare), 4),
                "hihat": round(_clamp(hihat), 4),
                "vocal": round(_clamp(vocal), 4),
                "drums": round(_clamp(drums), 4),
            }
        )

    sections = _sections(track_duration, energy_curve)
    return {
        "bpm": round(bpm, 2),
        "duration": round(track_duration, 2),
        "beats": beats[:1000],
        "energyCurve": energy_curve,
        "frequencyBands": frequency_bands,
        "reactiveFeatures": reactive_features,
        "sections": sections,
        "source": "estimated_from_metadata",
    }


def _estimate_bpm(seed: int, title: str, style: str) -> float:
    lower = f"{title} {style}".lower()
    if any(word in lower for word in ["dance", "club", "techno", "house", "edm", "drop"]):
        return 124 + seed % 12
    if any(word in lower for word in ["slow", "sad", "dream", "ambient", "chill"]):
        return 78 + seed % 24
    if any(word in lower for word in ["rock", "punk", "hard", "aggressive"]):
        return 132 + seed % 28
    return 96 + seed % 42


def _estimate_duration(seed: int) -> float:
    return float(150 + seed % 110)


def _sections(duration: float, energy_curve: list[dict]) -> list[dict]:
    templates = [
        ("intro", 0.0, 0.18),
        ("verse", 0.18, 0.48),
        ("chorus_or_drop", 0.48, 0.78),
        ("outro", 0.78, 1.0),
    ]
    sections = []
    for section_type, start_ratio, end_ratio in templates:
        start = round(duration * start_ratio, 2)
        end = round(duration * end_ratio, 2)
        samples = [point["value"] for point in energy_curve if start <= point["time"] < end]
        intensity = sum(samples) / max(1, len(samples))
        sections.append({"start": start, "end": end, "type": section_type, "intensity": round(intensity, 3)})
    return sections


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _pulse(phase: float, center: float, width: float) -> float:
    distance = abs(phase - center)
    distance = min(distance, 1 - distance)
    return _clamp(1 - distance / width)
