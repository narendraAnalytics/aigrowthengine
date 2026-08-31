"""Liveness and readiness probes.

- /healthz  — the process is up. No dependencies. Never touches the DB.
- /readyz   — the process can serve traffic: the database answers `SELECT 1`.
              Returns 503 (not 500) when the DB is down — the condition is
              transient and load balancers should retry.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiErrorBody, ApiErrorPayload
from app.core.logging import get_logger
from app.db.session import get_session

router = APIRouter(tags=["health"])
log = get_logger()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", response_model=None)
async def readyz(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> JSONResponse | dict[str, str]:
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        log.warning("readiness_check_failed", exc_info=True)
        request_id = getattr(request.state, "request_id", "")
        body = ApiErrorBody(
            error=ApiErrorPayload(
                code="internal_error",
                message="database unreachable",
                details=[],
                request_id=request_id,
            )
        )
        return JSONResponse(status_code=503, content=body.model_dump())
    return {"status": "ready"}
