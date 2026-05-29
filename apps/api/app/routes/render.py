from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, Render

router = APIRouter(prefix="/projects", tags=["render"])


@router.post("/{project_id}/render")
def start_render(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    render = Render(project_id=project.id, status="queued")
    project.status = "rendering"
    db.add(render)
    db.add(project)
    db.commit()
    db.refresh(render)
    return {"renderId": render.id, "status": render.status}
