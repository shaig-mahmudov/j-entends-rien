import os
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile


STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./storage")).resolve()


def ensure_storage() -> None:
    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
    (STORAGE_ROOT / "audio").mkdir(parents=True, exist_ok=True)
    (STORAGE_ROOT / "renders").mkdir(parents=True, exist_ok=True)


def save_upload(file: UploadFile, project_id: str) -> tuple[str, str]:
    ensure_storage()
    suffix = Path(file.filename or "audio").suffix
    filename = f"{project_id}-{uuid.uuid4()}{suffix}"
    target = STORAGE_ROOT / "audio" / filename
    with target.open("wb") as output:
        shutil.copyfileobj(file.file, output)
    return str(target), filename
