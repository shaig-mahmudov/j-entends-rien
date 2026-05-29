import json
import re
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import urlopen


def extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        return parsed.path.strip("/") or None
    if "youtube.com" in host:
        query_id = parse_qs(parsed.query).get("v", [None])[0]
        if query_id:
            return query_id
        match = re.search(r"/(?:shorts|embed)/([^/?#]+)", parsed.path)
        if match:
            return match.group(1)
    return None


def preview_from_url(url: str) -> dict:
    video_id = extract_video_id(url)
    thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg" if video_id else None
    metadata = {
        "youtubeTitle": None,
        "youtubeThumbnailUrl": thumbnail,
        "youtubeDuration": None,
    }

    try:
        oembed_url = f"https://www.youtube.com/oembed?url={quote(url, safe='')}&format=json"
        with urlopen(oembed_url, timeout=3) as response:
            payload = json.loads(response.read().decode("utf-8"))
        metadata["youtubeTitle"] = payload.get("title")
        metadata["youtubeThumbnailUrl"] = payload.get("thumbnail_url") or thumbnail
    except Exception:
        pass

    return metadata
