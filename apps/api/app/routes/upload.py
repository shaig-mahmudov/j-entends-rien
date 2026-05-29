from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AudioFile, Project
from app.services.storage import STORAGE_ROOT, save_upload

router = APIRouter(prefix="/projects", tags=["upload"])


@router.post("/{project_id}/audio")
def upload_audio(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    storage_url, stored_filename = save_upload(file, project_id)
    audio_file = AudioFile(
        project_id=project.id,
        storage_url=storage_url,
        original_filename=file.filename or stored_filename,
    )
    project.status = "uploaded"
    db.add(audio_file)
    db.add(project)
    db.commit()
    db.refresh(audio_file)
    relative = storage_url
    try:
        relative = f"/storage/{Path(storage_url).resolve().relative_to(STORAGE_ROOT).as_posix()}"
    except Exception:
        pass
    return {"audioFileId": audio_file.id, "status": "uploaded", "audioUrl": relative}
