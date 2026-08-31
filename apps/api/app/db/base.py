"""SQLAlchemy declarative base. Models land in app/models/ in Phase 3 (the
Drizzle → SQLAlchemy port + the "who owns migrations" ADR happen then)."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
