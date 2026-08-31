"""structlog configuration: JSON logs in every environment, with a per-request
`request_id` bound via a context variable so every log line in a request is
correlated."""

from __future__ import annotations

import logging
from contextvars import ContextVar

import structlog
from structlog.types import EventDict, WrappedLogger

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)


def set_request_id(request_id: str) -> None:
    _request_id.set(request_id)


def _add_request_id(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
    request_id = _request_id.get()
    if request_id is not None:
        event_dict["request_id"] = request_id
    return event_dict


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(format="%(message)s", level=level.upper())
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            _add_request_id,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.getLevelName(level.upper())),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


get_logger = structlog.get_logger
