from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.config import get_settings


def _db_configured() -> bool:
    try:
        return bool(get_settings().database_url)
    except Exception:
        return False


async def test_healthz(client: AsyncClient) -> None:
    resp = await client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
    assert resp.headers.get("x-request-id")


async def test_request_id_is_propagated(client: AsyncClient) -> None:
    resp = await client.get("/healthz", headers={"x-request-id": "abc-123"})
    assert resp.headers["x-request-id"] == "abc-123"


async def test_unknown_route_uses_error_envelope(client: AsyncClient) -> None:
    resp = await client.get("/nope")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "not_found"
    assert body["error"]["request_id"]
    assert body["error"]["details"] == []


@pytest.mark.skipif(not _db_configured(), reason="no DATABASE_URL configured")
async def test_readyz(client: AsyncClient) -> None:
    resp = await client.get("/readyz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready"}
