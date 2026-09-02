"""FastAPI application factory: middleware, routers, exception handlers.

Layering (roadmap Section B): routers -> services -> repositories. Routers do
HTTP only; services hold business logic and import no HTTP; repositories are the
only place a DB session is used.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.routers import health, voice
from app.core.config import get_settings
from app.core.errors import (
    HTTP_STATUS_FOR_CODE,
    ApiError,
    ApiErrorBody,
    ApiErrorCode,
    ApiErrorDetail,
    ApiErrorPayload,
)
from app.core.logging import configure_logging, get_logger, set_request_id
from app.core.observability import init_sentry

settings = get_settings()
configure_logging(settings.log_level)
init_sentry()
log = get_logger()

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])

REQUEST_ID_HEADER = "x-request-id"

# HTTP status -> our stable error code (reverse of HTTP_STATUS_FOR_CODE).
_CODE_FOR_STATUS: dict[int, ApiErrorCode] = {
    status: code  # type: ignore[misc]
    for code, status in HTTP_STATUS_FOR_CODE.items()
}


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    log.info("api_startup", environment=settings.environment)
    yield
    log.info("api_shutdown")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assign/propagate a request id and bind it to the logger for the request."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        request.state.request_id = request_id
        set_request_id(request_id)
        structlog.contextvars.bind_contextvars(
            request_id=request_id, path=request.url.path, method=request.method
        )
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.clear_contextvars()
        response.headers[REQUEST_ID_HEADER] = request_id
        return response


def _request_id(request: Request) -> str:
    rid = getattr(request.state, "request_id", "")
    return rid if isinstance(rid, str) else ""


def _envelope(
    code: ApiErrorCode,
    message: str,
    request_id: str,
    details: list[ApiErrorDetail] | None = None,
) -> JSONResponse:
    body = ApiErrorBody(
        error=ApiErrorPayload(
            code=code, message=message, details=details or [], request_id=request_id
        )
    )
    return JSONResponse(status_code=HTTP_STATUS_FOR_CODE[code], content=body.model_dump())


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Growth Engine API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if settings.is_prod else "/docs",
        redoc_url=None,
    )

    app.state.limiter = limiter
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[REQUEST_ID_HEADER],
    )

    @app.exception_handler(ApiError)
    async def _handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        body = exc.to_body(_request_id(request))
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            ApiErrorDetail(
                field=".".join(str(p) for p in err["loc"] if p != "body"),
                message=err["msg"],
            )
            for err in exc.errors()
        ]
        return _envelope(
            "validation_error", "request validation failed", _request_id(request), details
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _CODE_FOR_STATUS.get(exc.status_code, "internal_error")
        message = exc.detail if isinstance(exc.detail, str) else code.replace("_", " ")
        return _envelope(code, message, _request_id(request))

    @app.exception_handler(RateLimitExceeded)
    async def _handle_rate_limit(request: Request, _: RateLimitExceeded) -> JSONResponse:
        return _envelope("rate_limited", "rate limit exceeded", _request_id(request))

    @app.exception_handler(Exception)
    async def _handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        log.error("unhandled_exception", exc_info=exc)
        return _envelope("internal_error", "internal server error", _request_id(request))

    app.include_router(health.router)
    app.include_router(voice.router)
    return app


app = create_app()
