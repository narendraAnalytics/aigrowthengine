from __future__ import annotations

import os
from collections.abc import AsyncIterator

# Keep Sentry inert during tests — set before app.main imports (which calls
# init_sentry). An explicit env var beats the value in .env.
os.environ.setdefault("SENTRY_DSN", "")

import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
