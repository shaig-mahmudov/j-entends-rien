from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.session import init_db
from app.models import AudioFile, Lyric, Project, Render
from app.routes import ai, analysis, projects, render, upload
from app.services.storage import STORAGE_ROOT, ensure_storage

app = FastAPI(title="j-entends-rien API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    ensure_storage()
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(projects.router)
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(ai.router)
app.include_router(render.router)
ensure_storage()
app.mount("/storage", StaticFiles(directory=STORAGE_ROOT), name="storage")

_models = (AudioFile, Lyric, Project, Render)
