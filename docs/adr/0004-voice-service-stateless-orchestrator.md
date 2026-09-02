# ADR 0004 — Voice "Call Me" service is a stateless Sarvam orchestrator

**Status:** accepted · **Date:** 2026-09-01

## Context

The "Get a Call" path on `/ai-opportunities` lets a visitor request an AI
follow-up phone call instead of filling a form. The call is placed by
**Sarvam Voice Agents** from a Sarvam-rented number. We want voice orchestration
isolated from the main app (Sarvam must never be in the web form's request
path), and we do not want to open the still-deferred "Alembic vs Drizzle owns
the schema" question (ADR pending) just to ship this.

`apps/api` has a full FastAPI skeleton but zero SQLAlchemy models and zero
Alembic migrations.

## Decision

The voice service in `apps/api` is a **stateless orchestrator**. It has **no
database, no models, no migration**.

- **All persistence lives in `apps/web`** (Drizzle): migration `0008` adds
  `voice_call_requests` + `voice_call_emails`. Drizzle remains the sole schema
  owner on the shared Neon DB.
- The idempotency key `request_id` (uuid, minted by the web app) round-trips
  through Sarvam's `webhook_config.metadata`, which Sarvam echoes on the
  end-of-call webhook. The service therefore never needs to look anything up.
- Flow: web stores the lead + emails → authenticated `POST /v1/voice/calls`
  (shared `VOICE_WEBHOOK_SECRET`) → service calls Sarvam instant-outbound →
  Sarvam `POST /v1/voice/sarvam/on-end` → service maps a deterministic outcome
  (`voice_outcome.py`) → authenticated `POST {web}/api/voice/call-result` → web
  updates the row, audits, emails the team a summary.
- Deployed to **Render** (Docker, `apps/api/render.yaml`).
- English only for V1.

## Consequences

- Shipping needs no decision on who owns the API schema — deferred as before.
- If the service later needs its own state (e.g. call-attempt tracking,
  retry/callback scheduling), that is the trigger to resolve the schema-owner
  ADR and add the first SQLAlchemy model + Alembic migration.
- The web `/api/voice/call-result` handler is the single idempotency
  enforcement point (terminal row status → no-op), so a duplicated Sarvam or
  service webhook never sends a second summary email.
- Deferred: `/admin/voice-calls` UI, CRM lead auto-create, HMAC-signed webhooks,
  PostHog events, call-recording storage, multi-language.
