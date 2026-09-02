"""Application settings, loaded from the environment (see .env.example)."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["dev", "staging", "prod"]

# libpq query params that asyncpg does not accept as connect() kwargs. SSL is
# handled separately via connect_args in app/db/session.py (Neon always needs it).
_DROP_QUERY_PARAMS = {"sslmode", "channel_binding"}


def normalize_database_url(value: str) -> str:
    """Accept a plain libpq URL and return an asyncpg-driver URL asyncpg can use."""
    if value.startswith("postgres://"):
        value = "postgresql://" + value[len("postgres://") :]
    if value.startswith("postgresql://"):
        value = "postgresql+asyncpg://" + value[len("postgresql://") :]

    parts = urlsplit(value)
    kept = [(k, v) for k, v in parse_qsl(parts.query) if k not in _DROP_QUERY_PARAMS]
    return urlunsplit(parts._replace(query=urlencode(kept)))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Environment = "dev"
    log_level: str = "INFO"

    database_url: str = Field(..., description="Postgres connection string")

    # CORS: exact origins allowed to call the API from a browser.
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    # Regex for preview origins (Vercel deploy URLs).
    cors_origin_regex: str | None = r"https://.*\.vercel\.app"

    rate_limit_default: str = "60/minute"

    # Sentry — SDK no-ops when the DSN is unset.
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.1
    sentry_release: str | None = None

    # Groq (LLM) — required once the assessment engine lands (Phase 3).
    # See docs/adr/0001-ai-provider-groq.md.
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    groq_prompt_guard_model: str = "meta-llama/llama-prompt-guard-2-86m"

    # Voice "Call Me" follow-up (Sarvam Voice Agents). This service is a
    # stateless orchestrator — see voiceplan.txt / docs/adr/0002.
    sarvam_api_key: str | None = None
    sarvam_api_base: str = "https://apps.sarvam.ai"
    sarvam_voice_app_id: str | None = None
    # Plain integer, e.g. 1 — confirmed against the dashboard's own generated
    # curl example (voiceai.txt), which uses "app_version": 1 even while the
    # agent shows "v1 · Draft" in the UI.
    sarvam_voice_app_version: int = 1
    sarvam_voice_connection_id: str | None = None
    sarvam_voice_agent_phone_number: str | None = None
    sarvam_voice_org_id: str | None = None
    sarvam_voice_workspace_id: str | None = None
    # Shared secret for the web <-> voice-service webhooks (both directions).
    voice_webhook_secret: str | None = None
    # Public base URL of THIS service (for the Sarvam on-end webhook URL).
    public_api_url: str = "http://localhost:8000"
    # Base URL of apps/web (for the call-result callback).
    web_app_url: str = "http://localhost:3000"

    @property
    def voice_configured(self) -> bool:
        return all(
            [
                self.sarvam_api_key,
                self.sarvam_voice_app_id,
                self.sarvam_voice_connection_id,
                self.sarvam_voice_agent_phone_number,
                self.sarvam_voice_org_id,
                self.sarvam_voice_workspace_id,
                self.voice_webhook_secret,
            ]
        )

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        return normalize_database_url(value)

    @property
    def is_prod(self) -> bool:
        return self.environment == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()
