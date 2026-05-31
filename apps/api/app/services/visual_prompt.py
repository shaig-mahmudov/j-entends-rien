import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.services.lyrics_analysis import parse_lyrics_moments


def generate_visual_config(
    *,
    title: str | None,
    audio_analysis: dict | None,
    lyrics: str | None,
    style_preference: str | None,
) -> dict:
    fallback = _generate_local_visual_config(
        title=title,
        audio_analysis=audio_analysis,
        lyrics=lyrics,
        style_preference=style_preference,
    )
    if os.getenv("AI_PROVIDER", "local").lower() != "gemini":
        return fallback
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback

    try:
        gemini_config = _generate_gemini_visual_config(
            api_key=api_key,
            fallback=fallback,
            title=title,
            audio_analysis=audio_analysis,
            lyrics=lyrics,
            style_preference=style_preference,
        )
        return _coerce_visual_config(gemini_config, fallback)
    except Exception:
        return fallback


def _generate_local_visual_config(
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


def _generate_gemini_visual_config(
    *,
    api_key: str,
    fallback: dict,
    title: str | None,
    audio_analysis: dict | None,
    lyrics: str | None,
    style_preference: str | None,
) -> dict:
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip() or "gemini-3.5-flash"
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    prompt = _gemini_prompt(
        fallback=fallback,
        title=title,
        audio_analysis=audio_analysis,
        lyrics=lyrics,
        style_preference=style_preference,
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.45,
            "responseMimeType": "application/json",
        },
    }
    request = Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=20) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError) as error:
        raise RuntimeError(f"Gemini visual config request failed: {error}") from error

    text = (
        response_payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    return _parse_json_object(text)


def _gemini_prompt(
    *,
    fallback: dict,
    title: str | None,
    audio_analysis: dict | None,
    lyrics: str | None,
    style_preference: str | None,
) -> str:
    return f"""
You are the visual director for the music visualizer app J'entends Rien.
Return only one JSON object. Do not include markdown, comments, or extra text.

The frontend can render only these sceneType values:
- particle_field
- waveform_landscape
- neon_tunnel

Required JSON shape:
{{
  "vibe": "short style phrase",
  "mood": "short emotional description",
  "colorPalette": ["black", "violet", "blue", "cyan"],
  "visualStyle": "short visual art direction",
  "cameraStyle": "short camera direction",
  "effects": {{
    "beatPulse": true,
    "bassDistortion": true,
    "lyricHighlights": false,
    "particleExplosions": true
  }},
  "scenes": [
    {{
      "start": 0,
      "end": 24,
      "sceneType": "particle_field",
      "description": "scene description",
      "intensity": 0.3
    }}
  ],
  "lyricsMoments": []
}}

Use the audio sections as the timeline. Keep intensity between 0 and 1.

Track title: {title or "Untitled track"}
User style preference: {style_preference or "dark neon dreamy"}
Audio analysis JSON: {json.dumps(audio_analysis or {}, ensure_ascii=False)[:5000]}
Optional lyrics: {(lyrics or "")[:1500]}

If anything is uncertain, keep this baseline structure and improve its art direction:
{json.dumps(fallback, ensure_ascii=False)}
""".strip()


def _parse_json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(cleaned[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response was not a JSON object")
    return parsed


def _coerce_visual_config(config: dict, fallback: dict) -> dict:
    scenes = config.get("scenes") if isinstance(config.get("scenes"), list) else fallback["scenes"]
    coerced_scenes = []
    valid_scene_types = {"particle_field", "waveform_landscape", "neon_tunnel"}
    for index, scene in enumerate(scenes):
        if not isinstance(scene, dict):
            continue
        fallback_scene = fallback["scenes"][min(index, len(fallback["scenes"]) - 1)]
        scene_type = scene.get("sceneType") if scene.get("sceneType") in valid_scene_types else fallback_scene["sceneType"]
        coerced_scenes.append(
            {
                "start": _number(scene.get("start"), fallback_scene["start"]),
                "end": _number(scene.get("end"), fallback_scene["end"]),
                "sceneType": scene_type,
                "description": str(scene.get("description") or fallback_scene["description"]),
                "intensity": max(0.0, min(1.0, _number(scene.get("intensity"), fallback_scene["intensity"]))),
            }
        )
    if not coerced_scenes:
        coerced_scenes = fallback["scenes"]

    effects = config.get("effects") if isinstance(config.get("effects"), dict) else {}
    palette = config.get("colorPalette") if isinstance(config.get("colorPalette"), list) else fallback["colorPalette"]
    palette = [str(color) for color in palette if str(color).strip()][:6]
    if len(palette) < 3:
        palette = fallback["colorPalette"]

    lyrics_moments = config.get("lyricsMoments") if isinstance(config.get("lyricsMoments"), list) else fallback["lyricsMoments"]
    lyrics_moments = [moment for moment in lyrics_moments if isinstance(moment, dict)]

    return {
        "vibe": str(config.get("vibe") or fallback["vibe"]),
        "mood": str(config.get("mood") or fallback["mood"]),
        "colorPalette": palette,
        "visualStyle": str(config.get("visualStyle") or fallback["visualStyle"]),
        "cameraStyle": str(config.get("cameraStyle") or fallback["cameraStyle"]),
        "effects": {
            "beatPulse": bool(effects.get("beatPulse", fallback["effects"]["beatPulse"])),
            "bassDistortion": bool(effects.get("bassDistortion", fallback["effects"]["bassDistortion"])),
            "lyricHighlights": bool(effects.get("lyricHighlights", fallback["effects"]["lyricHighlights"])),
            "particleExplosions": bool(effects.get("particleExplosions", fallback["effects"]["particleExplosions"])),
        },
        "scenes": coerced_scenes,
        "lyricsMoments": lyrics_moments[:24],
    }


def _number(value: object, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(fallback)


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
