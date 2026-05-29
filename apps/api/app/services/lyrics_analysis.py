import re


TIMESTAMP_RE = re.compile(r"\[(?:(\d{1,2}):)?(\d{1,2})(?:[.:](\d{1,2}))?\]\s*(.+)")


def parse_lyrics_moments(text: str) -> list[dict]:
    moments = []
    for line in text.splitlines():
        match = TIMESTAMP_RE.match(line.strip())
        if not match:
            continue
        minutes = int(match.group(1) or 0)
        seconds = int(match.group(2) or 0)
        hundredths = int((match.group(3) or "0").ljust(2, "0")[:2])
        lyric = match.group(4).strip()
        if lyric:
            moments.append(
                {
                    "time": round(minutes * 60 + seconds + hundredths / 100, 2),
                    "text": lyric[:80],
                    "visualCue": _cue_for_line(lyric),
                }
            )
    return moments[:24]


def _cue_for_line(line: str) -> str:
    lower = line.lower()
    if any(word in lower for word in ["fall", "down", "sink"]):
        return "falling light streaks"
    if any(word in lower for word in ["fire", "burn", "heat"]):
        return "warm flare burst"
    if any(word in lower for word in ["night", "dark", "shadow"]):
        return "deep shadow bloom"
    if any(word in lower for word in ["love", "heart"]):
        return "soft cyan halo"
    return "lyric glow pulse"
