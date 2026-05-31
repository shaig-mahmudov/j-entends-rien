from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AudioFile, Project
from app.services.estimated_analysis import estimate_audio_analysis
from app.services.link_metadata import detect_provider, preview_from_url
from app.services.storage import STORAGE_ROOT
from app.services.visual_prompt import generate_visual_config

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    youtubeUrl: str
    youtubeTitle: str | None = None
    youtubeThumbnailUrl: str | None = None
    youtubeDuration: float | None = None


class UpdateProjectRequest(BaseModel):
    visualConfig: dict[str, Any] | None = None
    status: str | None = None


class InstantVisualRequest(BaseModel):
    lyrics: str | None = None
    stylePreference: str | None = "dark neon dreamy"


@router.post("")
def create_project(payload: CreateProjectRequest, db: Session = Depends(get_db)) -> dict:
    metadata = preview_from_url(payload.youtubeUrl)
    project = Project(
        youtube_url=payload.youtubeUrl,
        youtube_title=payload.youtubeTitle or metadata.get("title"),
        youtube_thumbnail_url=payload.youtubeThumbnailUrl or metadata.get("thumbnailUrl"),
        youtube_duration=payload.youtubeDuration or metadata.get("duration"),
        status="created",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"projectId": project.id, "status": project.status}


@router.post("/{project_id}/instant-visual")
def create_instant_visual(project_id: str, payload: InstantVisualRequest, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis = estimate_audio_analysis(
        title=project.youtube_title,
        duration=project.youtube_duration,
        style_preference=payload.stylePreference,
    )
    audio = latest_audio(project)
    if audio and audio.storage_url.startswith("metadata://"):
        audio.analysis_json = analysis
        audio.duration = analysis.get("duration")
        audio.bpm = analysis.get("bpm")
    else:
        audio = AudioFile(
            project_id=project.id,
            storage_url="metadata://estimated-analysis",
            original_filename="estimated-analysis.json",
            duration=analysis.get("duration"),
            bpm=analysis.get("bpm"),
            analysis_json=analysis,
        )
        db.add(audio)

    config = generate_visual_config(
        title=project.youtube_title,
        audio_analysis=analysis,
        lyrics=payload.lyrics,
        style_preference=payload.stylePreference,
    )
    project.visual_config_json = config
    project.status = "ready"
    project.updated_at = datetime.utcnow()
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"jobId": project.id, "status": project.status, "audioAnalysis": analysis, "visualConfig": config}


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_response(project)


@router.patch("/{project_id}")
def update_project(project_id: str, payload: UpdateProjectRequest, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.visualConfig is not None:
        project.visual_config_json = payload.visualConfig
    if payload.status is not None:
        project.status = payload.status
    project.updated_at = datetime.utcnow()
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_response(project)


def project_response(project: Project) -> dict:
    audio = latest_audio(project)
    provider, external_id = detect_provider(project.youtube_url)
    return {
        "id": project.id,
        "youtubeUrl": project.youtube_url,
        "youtubeTitle": project.youtube_title,
        "youtubeThumbnailUrl": project.youtube_thumbnail_url,
        "youtubeDuration": project.youtube_duration,
        "sourceProvider": provider,
        "externalId": external_id,
        "status": project.status,
        "audioUrl": audio_url(audio) if audio else None,
        "audioAnalysis": audio.analysis_json if audio else None,
        "visualConfig": project.visual_config_json,
        "renders": [
            {
                "id": render.id,
                "status": render.status,
                "outputUrl": render.output_url,
                "errorMessage": render.error_message,
            }
            for render in sorted(project.renders, key=lambda item: item.created_at, reverse=True)
        ],
        "createdAt": project.created_at.isoformat() if project.created_at else None,
        "updatedAt": project.updated_at.isoformat() if project.updated_at else None,
    }


def latest_audio(project: Project) -> AudioFile | None:
    if not project.audio_files:
        return None
    return sorted(project.audio_files, key=lambda item: item.created_at, reverse=True)[0]


def audio_url(audio: AudioFile) -> str | None:
    try:
        relative = Path(audio.storage_url).resolve().relative_to(STORAGE_ROOT)
        return f"/storage/{relative.as_posix()}"
    except Exception:
        return None
