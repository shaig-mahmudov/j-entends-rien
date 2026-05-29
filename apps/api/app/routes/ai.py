from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Lyric, Project
from app.routes.projects import latest_audio
from app.services.lyrics_analysis import parse_lyrics_moments
from app.services.visual_prompt import generate_visual_config

router = APIRouter(prefix="/projects", tags=["ai"])


class VisualConfigRequest(BaseModel):
    lyrics: str | None = None
    stylePreference: str | None = None


@router.post("/{project_id}/visual-config")
def visual_config(project_id: str, payload: VisualConfigRequest, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    audio = latest_audio(project)
    config = generate_visual_config(
        title=project.youtube_title,
        audio_analysis=audio.analysis_json if audio else None,
        lyrics=payload.lyrics,
        style_preference=payload.stylePreference,
    )
    project.visual_config_json = config
    project.status = "ready"
    if payload.lyrics:
        db.add(
            Lyric(
                project_id=project.id,
                text=payload.lyrics,
                timestamps_json=parse_lyrics_moments(payload.lyrics),
            )
        )
    db.add(project)
    db.commit()
    return {"visualConfig": config}
