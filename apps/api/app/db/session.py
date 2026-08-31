"""Async engine + session factory for Neon Postgres.

`pool_pre_ping` guards against Neon dropping idle connections; the pool is kept
small because Neon's own pooler sits in front. Repositories are the only layer
that touches a session (see roadmap Section B)."""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

_settings = get_settings()

engine: AsyncEngine = create_async_engine(
    _settings.database_url,
    # Neon requires TLS; the libpq `sslmode`/`channel_binding` params are stripped
    # from the URL in config.py because asyncpg rejects them as kwargs.
    connect_args={"ssl": True},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    echo=False,
)

SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency — yields a session and always closes it."""
    async with SessionFactory() as session:
        yield session
