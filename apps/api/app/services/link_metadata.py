import json
import re
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import urlopen


def detect_provider(url: str) -> tuple[str, str | None]:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        return "youtube", parsed.path.strip("/") or None
    if "youtube.com" in host:
        query_id = parse_qs(parsed.query).get("v", [None])[0]
        if query_id:
            return "youtube", query_id
        match = re.search(r"/(?:shorts|embed)/([^/?#]+)", parsed.path)
        if match:
            return "youtube", match.group(1)
    if "open.spotify.com" in host:
        match = re.search(r"/(?:intl-[a-z]{2}/)?(track|album|playlist)/([^/?#]+)", parsed.path)
        if match:
            return f"spotify_{match.group(1)}", match.group(2)
        return "spotify", None
    return "url", None


def preview_from_url(url: str) -> dict:
    provider, external_id = detect_provider(url)
    metadata = {
        "provider": provider,
        "externalId": external_id,
        "title": None,
        "thumbnailUrl": None,
        "duration": None,
        "artist": None,
    }

    if provider == "youtube" and external_id:
        metadata["thumbnailUrl"] = f"https://img.youtube.com/vi/{external_id}/hqdefault.jpg"
        metadata.update(_oembed(f"https://www.youtube.com/oembed?url={quote(url, safe='')}&format=json"))
    elif provider.startswith("spotify"):
        metadata.update(_spotify_oembed(url))
    else:
        metadata["title"] = _fallback_title(url)

    return metadata


def _oembed(endpoint: str) -> dict:
    try:
        with urlopen(endpoint, timeout=3) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return {
            "title": payload.get("title"),
            "thumbnailUrl": payload.get("thumbnail_url"),
        }
    except Exception:
        return {}


def _spotify_oembed(url: str) -> dict:
    data = _oembed(f"https://open.spotify.com/oembed?url={quote(url, safe='')}")
    title = data.get("title")
    artist = None
    if title and " - " in title:
        possible_title, possible_artist = title.rsplit(" - ", 1)
        title = possible_title.strip()
        artist = possible_artist.strip()
    return {
        "title": title,
        "artist": artist,
        "thumbnailUrl": data.get("thumbnailUrl"),
    }


def _fallback_title(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("-", " ").replace("_", " ")
    return path.title() if path else parsed.netloc or "Untitled track"
