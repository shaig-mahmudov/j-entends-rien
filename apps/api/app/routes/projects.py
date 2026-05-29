from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AudioFile, Project
from app.services.storage import STORAGE_ROOT
from app.services.youtube_metadata import preview_from_url

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    youtubeUrl: str
    youtubeTitle: str | None = None
    youtubeThumbnailUrl: str | None = None
    youtubeDuration: float | None = None


class UpdateProjectRequest(BaseModel):
    visualConfig: dict[str, Any] | None = None
    status: str | None = None


@router.post("")
def create_project(payload: CreateProjectRequest, db: Session = Depends(get_db)) -> dict:
    metadata = preview_from_url(payload.youtubeUrl)
    project = Project(
        youtube_url=payload.youtubeUrl,
        youtube_title=payload.youtubeTitle or metadata.get("youtubeTitle"),
        youtube_thumbnail_url=payload.youtubeThumbnailUrl or metadata.get("youtubeThumbnailUrl"),
        youtube_duration=payload.youtubeDuration or metadata.get("youtubeDuration"),
        status="created",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"projectId": project.id, "status": project.status}


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
    return {
        "id": project.id,
        "youtubeUrl": project.youtube_url,
        "youtubeTitle": project.youtube_title,
        "youtubeThumbnailUrl": project.youtube_thumbnail_url,
        "youtubeDuration": project.youtube_duration,
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
