# ADR 0002 — Assessment pipeline runs in `apps/web` (Next.js) for Slice A

**Status:** accepted · **Date:** 2026-08-31

## Context

Phase 3 delivers "problem in → assessment out": a signed-in user submits a
plain-language business problem and gets back a capability-backed, explainable
opportunity assessment. The target architecture (CLAUDE.md, roadmap 3.1–3.6)
puts this pipeline in the FastAPI service `apps/api` with SQLAlchemy/Alembic
owning the schema.

`apps/api` does not exist yet (Phase 1.5 placeholder). What *does* exist and is
tested, all in `apps/web`:

- the scoring engine — `src/lib/scoring/` (7 factors, deterministic, versioned,
  `check:scoring` gate)
- the Capability Library + controlled vocabularies — `src/lib/capabilities/`
- the intake questions — `src/lib/assessment/questions.ts`
- the v1 API contract Zod schemas — `src/lib/api/contract/assessment.ts`
- the Drizzle tables `assessments`, `assessment_results`, `capability_matches`,
  `expert_review_requests`, `audit_events` — already migrated to Neon

The roadmap's own rule: **don't polish infrastructure before validating the
funnel.** Standing up FastAPI + porting the scoring/capability/contract code +
resolving "Alembic vs Drizzle owns the schema" before a single real assessment
has run is exactly that.

## Decision

**Slice A runs the entire assessment pipeline in `apps/web` as Next.js route
handlers and server modules**, reusing the existing TypeScript contracts and
Drizzle tables.

- `POST /api/assessments` → `src/server/assessment/run-assessment.ts`
  orchestrates: validate answers → one Groq call (signals only) → Zod
  re-validation with one repair retry then fail-closed → deterministic
  capability match (`src/lib/matching/`) → override `solution_fit` from the
  match → `computeLeadScore()` → persist.
- `GET` of the result is a server component reading through
  `src/server/assessment/get-result.ts` (ownership-checked).
- `POST /api/assessments/:id/expert-review` writes the request row.
- The Groq call runs **synchronously** inside the request (a few seconds); no
  background job or SSE.
- Outbound Groq calls are logged lightweight — a Sentry breadcrumb plus an
  `ai_gateway.request` `audit_events` row (model, latency, token counts,
  outcome, prompt hash). The full `ai_runs` table is deferred.
- Unit tests run on Vitest (added this slice): the pure matcher, the assessment
  JSON/Zod schema, and the pipeline core (`deriveAssessmentOutcome`).

### Explicitly deferred to full Phase 3

FastAPI port · the "Alembic vs Drizzle owns the schema" ADR · prompt-injection
guard (`llama-prompt-guard-2-86m`) · resumable localStorage drafts · honeypot +
Turnstile · Idempotency-Key store · background job / SSE · capability admin CRUD
+ seed-from-YAML · public capability read API + `/solutions` pages · eval harness
/ golden dataset · PDF export + shareable signed links · lead auto-creation ·
PostHog step events · vector matching · full multi-step wizard.

## Consequences

- The scoring, capability, and contract modules stay framework-agnostic (no Next
  imports) so the later FastAPI port is a translation, not a redesign. The
  `src/server/db` layer is likewise Next-free.
- The matcher is versioned independently (`MATCHER_VERSION = "1.0.0"`) alongside
  `SCORING_MODEL_VERSION`.
- Neon's HTTP driver has no interactive transactions; the persist step uses
  `db.batch([...])` with a client-generated result id for atomicity.
- **Port trigger:** move the pipeline to `apps/api` when any of — assessments
  need to run as background jobs, other services must call the engine, the eval
  harness (3.6) lands, or Python-only AI tooling is required. At that point the
  schema-ownership ADR must be written first.
- `GROQ_API_KEY` is now a required server env var in `apps/web`.
