from app.services.link_metadata import detect_provider, preview_from_url


def extract_video_id(url: str) -> str | None:
    provider, external_id = detect_provider(url)
    return external_id if provider == "youtube" else None


def youtube_preview_from_url(url: str) -> dict:
    metadata = preview_from_url(url)
    return {
        "youtubeTitle": metadata.get("title"),
        "youtubeThumbnailUrl": metadata.get("thumbnailUrl"),
        "youtubeDuration": metadata.get("duration"),
    }
