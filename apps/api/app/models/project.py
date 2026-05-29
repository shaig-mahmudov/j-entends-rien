import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.session import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    youtube_url: Mapped[str] = mapped_column(Text)
    youtube_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    youtube_thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    youtube_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="created")
    visual_config_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audio_files = relationship("AudioFile", back_populates="project", cascade="all, delete-orphan")
    lyrics = relationship("Lyric", back_populates="project", cascade="all, delete-orphan")
    renders = relationship("Render", back_populates="project", cascade="all, delete-orphan")
