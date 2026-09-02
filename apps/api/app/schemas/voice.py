"""Pydantic contracts for the voice "Call Me" follow-up.

This service is a stateless orchestrator: the web app owns all persistence. The
`request_id` round-trips through Sarvam's `webhook_config.metadata`, so nothing
here needs a database.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CallRequestIn(BaseModel):
    """Body of POST /v1/voice/calls — sent by apps/web after it stores the lead."""

    request_id: str
    phone: str
    full_name: str
    company: str | None = None
    requirement: str


class CallDispatchOut(BaseModel):
    attempt_id: str | None = None
    status: str = "calling"


class SarvamTranscriptTurn(BaseModel):
    role: str | None = None
    en_text: str | None = None


class SarvamWebhookConfig(BaseModel):
    url: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class SarvamEndPayload(BaseModel):
    """Instant-outbound webhook payload. Only the fields we use are declared;
    unknown keys are ignored."""

    model_config = {"extra": "ignore"}

    attempt_id: str | None = None
    status: str | None = None
    duration: float | int | None = None
    interaction_id: str | None = None
    failure_reason: str | None = None
    final_agent_variables: dict[str, object] | None = None
    interaction_transcript: list[SarvamTranscriptTurn] = Field(default_factory=list)
    webhook_config: SarvamWebhookConfig = Field(default_factory=SarvamWebhookConfig)


class CallResultOut(BaseModel):
    """Body of the callback POSTed to apps/web /api/voice/call-result."""

    request_id: str
    outcome: str
    call_status: str | None = None
    duration_seconds: int | None = None
    summary: str | None = None
    transcript: list[dict[str, str]] | None = None
