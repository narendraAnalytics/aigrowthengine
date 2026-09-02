"""Voice "Call Me" follow-up — stateless Sarvam orchestrator.

    POST /v1/voice/calls           (from apps/web) -> place a Sarvam outbound call
    POST /v1/voice/sarvam/on-end   (from Sarvam)   -> map outcome, notify apps/web

No database: `request_id` round-trips through Sarvam's webhook metadata. See
voiceplan.txt / docs/adr/0002.
"""

from __future__ import annotations

import hmac
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Header, Request

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.logging import get_logger
from app.schemas.voice import (
    CallDispatchOut,
    CallRequestIn,
    CallResultOut,
    SarvamEndPayload,
)
from app.services.voice_agent import place_call
from app.services.voice_notify import post_result_to_web
from app.services.voice_outcome import derive_outcome, transcript_pairs

router = APIRouter(prefix="/v1/voice", tags=["voice"])
log = get_logger()


def _secret_ok(candidate: str | None) -> bool:
    expected = get_settings().voice_webhook_secret
    if not candidate or not expected:
        return False
    return hmac.compare_digest(candidate, expected)


@router.post("/calls", response_model=CallDispatchOut)
async def create_call(
    body: CallRequestIn,
    x_voice_secret: Annotated[str | None, Header()] = None,
) -> CallDispatchOut:
    if not _secret_ok(x_voice_secret):
        raise ApiError("unauthorized", "invalid or missing voice secret")

    attempt_id = await place_call(
        request_id=body.request_id,
        phone=body.phone,
        full_name=body.full_name,
        company=body.company,
        requirement=body.requirement,
    )
    return CallDispatchOut(attempt_id=attempt_id, status="calling")


@router.post("/sarvam/on-end")
async def sarvam_on_end(
    request: Request,
    tasks: BackgroundTasks,
) -> dict[str, str]:
    raw = await request.json()
    payload = SarvamEndPayload.model_validate(raw)

    metadata = payload.webhook_config.metadata or {}
    request_id = str(metadata.get("request_id") or "")
    if not _secret_ok(str(metadata.get("secret") or "")) or not request_id:
        raise ApiError("unauthorized", "invalid webhook metadata")

    outcome = derive_outcome(payload)
    duration = int(payload.duration) if payload.duration is not None else None
    result = CallResultOut(
        request_id=request_id,
        outcome=outcome,
        call_status=payload.status,
        duration_seconds=duration,
        summary=payload.failure_reason,
        transcript=transcript_pairs(payload) or None,
    )

    log.info("voice_on_end", request_id=request_id, outcome=outcome, status=payload.status)
    tasks.add_task(post_result_to_web, result)
    return {"status": "accepted"}
