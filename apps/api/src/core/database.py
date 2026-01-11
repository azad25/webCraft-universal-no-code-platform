"""
Database Configuration for V2
SQLAlchemy setup with connection pooling and session management for V2 database
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from .config import settings

# Create engine with connection pooling for V2 database
engine = create_engine(
    settings.DATABASE_V2_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Session factory for V2
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for V2 models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting V2 database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for V2 database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


async def init_db():
    """Initialize V2 database tables"""
    Base.metadata.create_all(bind=engine)
