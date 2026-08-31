"""The v1 error envelope — mirrors apps/web/src/lib/api/errors.ts exactly.

    {"error": {"code", "message", "details": [{"field"?, "message"}], "request_id"}}

`code` is a stable machine string; clients switch on it. Keep this list and the
status map in sync with the TypeScript source.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

ApiErrorCode = Literal[
    "validation_error",
    "unauthorized",
    "forbidden",
    "not_found",
    "conflict",
    "rate_limited",
    "assessment_failed",
    "internal_error",
]

HTTP_STATUS_FOR_CODE: dict[str, int] = {
    "validation_error": 400,
    "unauthorized": 401,
    "forbidden": 403,
    "not_found": 404,
    "conflict": 409,
    "rate_limited": 429,
    "assessment_failed": 422,
    "internal_error": 500,
}


class ApiErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ApiErrorPayload(BaseModel):
    code: ApiErrorCode
    message: str
    details: list[ApiErrorDetail] = []
    request_id: str


class ApiErrorBody(BaseModel):
    error: ApiErrorPayload


class ApiError(Exception):
    """Raise from anywhere; the handler in main.py renders the envelope."""

    def __init__(
        self,
        code: ApiErrorCode,
        message: str,
        *,
        details: list[ApiErrorDetail] | None = None,
    ) -> None:
        super().__init__(message)
        self.code: ApiErrorCode = code
        self.message = message
        self.details = details or []

    @property
    def status_code(self) -> int:
        return HTTP_STATUS_FOR_CODE[self.code]

    def to_body(self, request_id: str) -> ApiErrorBody:
        return ApiErrorBody(
            error=ApiErrorPayload(
                code=self.code,
                message=self.message,
                details=self.details,
                request_id=request_id,
            )
        )
