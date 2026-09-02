from __future__ import annotations

from collections.abc import Iterator

import pytest
from httpx import AsyncClient

from app.core.config import get_settings

SECRET = "test-voice-secret-0123456789"


@pytest.fixture(autouse=True)
def _voice_settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    get_settings.cache_clear()
    for key, val in {
        "SARVAM_API_KEY": "sk_test",
        "SARVAM_VOICE_APP_ID": "app_1",
        "SARVAM_VOICE_CONNECTION_ID": "conn_1",
        "SARVAM_VOICE_AGENT_PHONE_NUMBER": "+910000000000",
        "SARVAM_VOICE_ORG_ID": "org_1",
        "SARVAM_VOICE_WORKSPACE_ID": "ws_1",
        "VOICE_WEBHOOK_SECRET": SECRET,
        "WEB_APP_URL": "http://web.test",
        "PUBLIC_API_URL": "http://api.test",
    }.items():
        monkeypatch.setenv(key, val)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def test_calls_requires_secret(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/voice/calls",
        json={
            "request_id": "r1",
            "phone": "+911111111111",
            "full_name": "Asha",
            "requirement": "invoice reconciliation is slow",
        },
    )
    assert resp.status_code == 401


async def test_calls_places_sarvam_call(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_place_call(**kwargs: object) -> str:
        assert kwargs["request_id"] == "r1"
        return "att_123"

    monkeypatch.setattr(
        "app.api.v1.routers.voice.place_call", fake_place_call
    )

    resp = await client.post(
        "/v1/voice/calls",
        headers={"x-voice-secret": SECRET},
        json={
            "request_id": "r1",
            "phone": "+911111111111",
            "full_name": "Asha",
            "company": "Acme",
            "requirement": "invoice reconciliation is slow",
        },
    )
    assert resp.status_code == 200
    assert resp.json() == {"attempt_id": "att_123", "status": "calling"}


async def test_on_end_maps_outcome_and_notifies(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, object] = {}

    async def fake_notify(result: object) -> bool:
        captured["result"] = result
        return True

    monkeypatch.setattr(
        "app.api.v1.routers.voice.post_result_to_web", fake_notify
    )

    resp = await client.post(
        "/v1/voice/sarvam/on-end",
        json={
            "attempt_id": "att_123",
            "status": "connected",
            "duration": 95,
            "final_agent_variables": {"interest": "yes", "wants_consultation": True},
            "interaction_transcript": [
                {"role": "agent", "en_text": "Hello"},
                {"role": "user", "en_text": "Yes please"},
            ],
            "webhook_config": {"metadata": {"request_id": "r1", "secret": SECRET}},
        },
    )
    assert resp.status_code == 200
    # BackgroundTasks run after the response in the test client lifecycle.
    result = captured.get("result")
    assert result is not None
    assert result.request_id == "r1"  # type: ignore[attr-defined]
    assert result.outcome == "consultation_requested"  # type: ignore[attr-defined]


async def test_on_end_rejects_bad_metadata_secret(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/voice/sarvam/on-end",
        json={
            "status": "connected",
            "webhook_config": {"metadata": {"request_id": "r1", "secret": "wrong"}},
        },
    )
    assert resp.status_code == 401
