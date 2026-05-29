import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project
from app.routes.projects import latest_audio
from app.services.audio_analysis import analyze_audio_file

router = APIRouter(prefix="/projects", tags=["analysis"])


@router.post("/{project_id}/analyze")
def analyze_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    audio = latest_audio(project)
    if not audio:
        raise HTTPException(status_code=400, detail="Upload an audio file before analysis")

    project.status = "analyzing"
    db.add(project)
    db.commit()

    analysis = analyze_audio_file(audio.storage_url)
    audio.analysis_json = analysis
    audio.duration = analysis.get("duration")
    audio.bpm = analysis.get("bpm")
    project.status = "analyzed"
    db.add(audio)
    db.add(project)
    db.commit()

    return {"jobId": str(uuid.uuid4()), "status": "analyzed", "audioAnalysis": analysis}
