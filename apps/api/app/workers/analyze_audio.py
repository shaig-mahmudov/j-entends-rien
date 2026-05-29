from app.workers.celery_app import celery_app


@celery_app.task
def analyze_audio_job(project_id: str) -> dict:
    return {"projectId": project_id, "status": "queued_for_mvp_sync_endpoint"}
