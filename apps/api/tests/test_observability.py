from __future__ import annotations

from typing import Any, cast

import pytest
import sentry_sdk
from sentry_sdk.types import Event

from app.core import observability


def test_init_sentry_is_noop_without_dsn(monkeypatch: pytest.MonkeyPatch) -> None:
    class _NoDsn:
        sentry_dsn = None
        environment = "dev"
        sentry_release = None
        sentry_traces_sample_rate = 0.1

    monkeypatch.setattr(observability, "get_settings", lambda: _NoDsn())
    observability.init_sentry()
    assert not sentry_sdk.get_client().is_active()


def test_scrub_removes_sensitive_data() -> None:
    event = cast(
        Event,
        {
            "request": {
                "cookies": {"session": "x"},
                "headers": {"Authorization": "Bearer x", "Accept": "json"},
            },
            "user": {"email": "a@b.com", "id": "user_1"},
        },
    )
    out = cast("dict[str, Any]", observability._scrub(event, {}))
    assert out is not None
    assert "cookies" not in out["request"]
    assert "Authorization" not in out["request"]["headers"]
    assert out["request"]["headers"]["Accept"] == "json"
    assert "email" not in out["user"]
    assert out["user"]["id"] == "user_1"
