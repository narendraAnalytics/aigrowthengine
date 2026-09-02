"""Place an outbound call through Sarvam Voice Agents (instant outbound).

Endpoint (confirmed against docs.sarvam.ai, 2026-09-01):
    POST {base}/api/outbounds/v1/orgs/{org}/workspaces/{ws}/outbounds
    header: api-subscription-key: <sarvam_api_key>
    body:   { app_config{...}, user_config{user_phone_number}, webhook_config{url, metadata} }
    -> 200 { "attempt_id": "..." }

Instant outbound has NO on_start webhook — all context goes in agent_variables.
"""

from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.logging import get_logger

log = get_logger()

# English only for V1.
_LANGUAGE = "English"


def _mask_phone(phone: str) -> str:
    return phone[:3] + "***" + phone[-2:] if len(phone) > 5 else "***"


async def place_call(
    *,
    request_id: str,
    phone: str,
    full_name: str,
    company: str | None,
    requirement: str,
) -> str | None:
    """Trigger the Sarvam outbound call. Returns the attempt id (or None)."""
    s = get_settings()
    if not s.voice_configured:
        raise ApiError("internal_error", "voice service is not configured")

    url = (
        f"{s.sarvam_api_base.rstrip('/')}/api/outbounds/v1"
        f"/orgs/{s.sarvam_voice_org_id}"
        f"/workspaces/{s.sarvam_voice_workspace_id}/outbounds"
    )
    body = {
        "app_config": {
            "app_id": s.sarvam_voice_app_id,
            "app_version": s.sarvam_voice_app_version,
            "connection_config": {
                "connection_id": s.sarvam_voice_connection_id,
                "agent_phone_number": s.sarvam_voice_agent_phone_number,
            },
            "agent_variables": {
                "caller_name": full_name,
                "company": company or "",
                "requirement": requirement,
            },
            "app_type": "agent",
            "app_overrides": {"initial_language_name": _LANGUAGE},
        },
        "user_config": {"user_phone_number": phone},
        "webhook_config": {
            "url": f"{s.public_api_url.rstrip('/')}/v1/voice/sarvam/on-end",
            "metadata": {
                "request_id": request_id,
                "secret": s.voice_webhook_secret,
            },
        },
    }

    log.info("sarvam_place_call", request_id=request_id, phone=_mask_phone(phone))
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                url,
                json=body,
                # Confirmed against the dashboard's own generated curl (voiceai.txt) —
                # Sarvam uses X-API-Key, not api-subscription-key.
                headers={"X-API-Key": s.sarvam_api_key or ""},
            )
    except httpx.HTTPError as exc:
        log.error("sarvam_place_call_error", request_id=request_id, error=str(exc))
        raise ApiError("internal_error", "could not reach the voice provider") from exc

    if resp.status_code >= 400:
        log.error(
            "sarvam_place_call_rejected",
            request_id=request_id,
            status=resp.status_code,
            body=resp.text[:500],
        )
        # Surface Sarvam's own error text (usually names the offending field) so
        # it lands in voice_call_requests.error, not just the service log.
        raise ApiError(
            "internal_error",
            f"voice provider returned {resp.status_code}: {resp.text[:800]}",
        )

    data = resp.json() if resp.content else {}
    attempt_id = data.get("attempt_id") if isinstance(data, dict) else None
    log.info("sarvam_place_call_ok", request_id=request_id, attempt_id=attempt_id)
    return attempt_id
