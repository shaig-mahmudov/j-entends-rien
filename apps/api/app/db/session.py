import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


SQLITE_FALLBACK_URL = "sqlite:///./storage/j_entends_rien.db"
DATABASE_URL = os.getenv("DATABASE_URL") or SQLITE_FALLBACK_URL


def _create_engine(database_url: str):
    engine_kwargs = {}
    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(database_url, **engine_kwargs)


engine = _create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db() -> None:
    global engine
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError:
        if DATABASE_URL.startswith("sqlite") or not _sqlite_fallback_enabled():
            raise
        fallback_url = os.getenv("SQLITE_FALLBACK_DATABASE_URL", SQLITE_FALLBACK_URL)
        engine = _create_engine(fallback_url)
        SessionLocal.configure(bind=engine)
        Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _sqlite_fallback_enabled() -> bool:
    return os.getenv("DB_FALLBACK_TO_SQLITE", "true").lower() not in {"0", "false", "no"}
