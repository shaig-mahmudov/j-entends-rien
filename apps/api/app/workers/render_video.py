from app.workers.celery_app import celery_app


@celery_app.task
def render_video_job(project_id: str) -> dict:
    return {"projectId": project_id, "status": "render_stub_queued"}
