"""POST the call outcome back to apps/web (/api/voice/call-result).

Authenticated with the shared VOICE_WEBHOOK_SECRET. Best-effort with a couple of
retries — the web handler is idempotent on `request_id`.
"""

from __future__ import annotations

import asyncio

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.voice import CallResultOut

log = get_logger()


async def post_result_to_web(result: CallResultOut) -> bool:
    s = get_settings()
    url = f"{s.web_app_url.rstrip('/')}/api/voice/call-result"
    headers = {"x-voice-secret": s.voice_webhook_secret or ""}

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    url, json=result.model_dump(), headers=headers
                )
            if resp.status_code < 300:
                log.info("voice_result_delivered", request_id=result.request_id)
                return True
            # 404 = the web app doesn't know this request_id; retrying won't help.
            if resp.status_code == 404:
                log.warning("voice_result_unknown_request", request_id=result.request_id)
                return False
            log.warning(
                "voice_result_rejected",
                request_id=result.request_id,
                status=resp.status_code,
                body=resp.text[:300],
            )
        except httpx.HTTPError as exc:
            log.warning(
                "voice_result_error", request_id=result.request_id, error=str(exc)
            )
        await asyncio.sleep(1.5 * (attempt + 1))

    log.error("voice_result_giving_up", request_id=result.request_id)
    return False
