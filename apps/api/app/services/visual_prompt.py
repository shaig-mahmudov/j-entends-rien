from app.services.lyrics_analysis import parse_lyrics_moments


def generate_visual_config(
    *,
    title: str | None,
    audio_analysis: dict | None,
    lyrics: str | None,
    style_preference: str | None,
) -> dict:
    sections = (audio_analysis or {}).get("sections") or [
        {"start": 0, "end": 30, "type": "intro", "intensity": 0.35},
        {"start": 30, "end": 60, "type": "chorus_or_drop", "intensity": 0.8},
    ]
    style = (style_preference or "dark neon dreamy").strip()
    lower_style = style.lower()
    palette = ["black", "violet", "blue", "cyan"]
    if "warm" in lower_style or "sunset" in lower_style:
        palette = ["black", "magenta", "amber", "white"]
    elif "forest" in lower_style or "organic" in lower_style:
        palette = ["black", "emerald", "teal", "silver"]
    elif "red" in lower_style or "aggressive" in lower_style:
        palette = ["black", "red", "hotpink", "white"]

    scene_cycle = ["particle_field", "waveform_landscape", "neon_tunnel"]
    scenes = []
    for index, section in enumerate(sections):
        intensity = float(section.get("intensity", 0.5))
        scene_type = "neon_tunnel" if section.get("type") == "chorus_or_drop" else scene_cycle[index % len(scene_cycle)]
        scenes.append(
            {
                "start": float(section.get("start", 0)),
                "end": float(section.get("end", 30)),
                "sceneType": scene_type,
                "description": _scene_description(scene_type, intensity),
                "intensity": round(max(0.0, min(1.0, intensity)), 3),
            }
        )

    return {
        "vibe": style,
        "mood": _mood_from_style(lower_style),
        "colorPalette": palette,
        "visualStyle": f"{style} reactive visuals for {title or 'the track'}",
        "cameraStyle": "slow floating camera with fast zooms on beat drops",
        "effects": {
            "beatPulse": True,
            "bassDistortion": True,
            "lyricHighlights": bool(lyrics),
            "particleExplosions": True,
        },
        "scenes": scenes,
        "lyricsMoments": parse_lyrics_moments(lyrics or ""),
    }


def _mood_from_style(style: str) -> str:
    if "aggressive" in style or "hard" in style:
        return "intense and kinetic"
    if "sad" in style or "melanch" in style:
        return "melancholic but energetic"
    if "warm" in style:
        return "glowing and euphoric"
    return "cinematic and hypnotic"


def _scene_description(scene_type: str, intensity: float) -> str:
    brightness = "low brightness" if intensity < 0.45 else "high contrast glow"
    if scene_type == "particle_field":
        return f"Floating particles with {brightness} and bass-reactive size"
    if scene_type == "waveform_landscape":
        return f"Audio waveform terrain with {brightness} and midrange ripples"
    return f"Fast neon tunnel with {brightness} and beat-synced acceleration"
