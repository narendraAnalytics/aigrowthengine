# ADR 0003 — AI drafts client-facing artifacts; a human approves the send

**Status:** accepted · **Date:** 2026-08-31

## Context

Phase 3 added two things a prospect can receive by email after an assessment:

1. a **solution narrative** — an AI-written "how this could be solved" explanation
2. a **client result email** carrying that narrative + the assessment summary

CLAUDE.md architecture rules that bear on this:

- **#2** — the AI may only recommend capabilities that exist in the Capability
  Library, and must *never invent a solution*.
- **#7** — every outbound artifact (proposal, follow-up email, agent action)
  requires a **recorded human approval**.
- **#8** — every sensitive action writes an append-only audit event.
- "Security is built through every phase, never deferred."

An assessment result the user self-serves on the result page is fine to show
immediately. An email *we send to them* is an outbound artifact.

## Decision

**The AI drafts. A human approves. The system sends.**

### Grounding the narrative (rule #2)

The narrative is produced by a **second Groq call that runs after the
deterministic matcher**, and is fed *only* the names + library descriptions of
the capabilities the matcher already selected. The prompt forbids naming any
other tool, and forbids timelines, durations, percentages, metrics, ROI, and
pricing. The output is scrubbed with a regex for leaked numbers/units/ROI; on a
hit — or any call failure, including a free-tier rate limit — it falls back to a
**deterministic templated narrative** built from the capabilities' own library
copy. `assessment_results.solution_narrative_source` records `ai` or `templated`.

### The approval gate (rule #7)

- `team_alert` email — internal lead notification — sends **automatically** on
  every scored assessment. Not a client-facing artifact.
- `client_result` email — created as an `assessment_emails` row with status
  `pending_approval`. It is **never sent by the pipeline**.
- A staff member opens `/admin/assessments/[id]/email`, sees the exact rendered
  email, and clicks **Approve & send**. That click:
  - records `approved_by`, `approved_at`, `approved_hash` (sha256 of
    `to + subject + body`)
  - sends **exactly the stored body** via Resend
  - writes `assessment_email.client_approved` then `assessment_email.client_sent`
    audit events
- If the stored body ever diverges from `approved_hash` before send, the send is
  refused and re-approval is required. (Editing the draft in place is not built
  yet; the check is in place for when it is.)

### Staff identity (interim)

Clerk roles/organizations are deferred (CLAUDE.md). Until they land, approval is
gated by a `STAFF_EMAILS` allowlist env var. The RBAC permission
`assessment:email:approve` is defined now (granted to `sales`, `management`,
`admin`) so the switch to real roles is a one-line change.

## Consequences

- Two Groq calls per assessment. Both are free on the Groq free tier (~2.8k
  tokens total); the narrative call uses `reasoning_effort: "low"` and a 900-token
  cap to stay well inside free-tier limits, with the templated fallback covering
  429s.
- New table `assessment_emails` (append-ish; state machine
  `pending_approval → approved → sent | failed`), new columns
  `assessments.contact_{email,company,note}` and
  `assessment_results.solution_narrative{,_source}`.
- Contact details (`company`, `work email`, `note`) are collected on the form but
  live in a **separate `contactSchema`**, never in `answers`, so they are never
  put in an LLM prompt.
- Email send failures never fail the assessment — they are logged (Sentry +
  audit) and the row is left retriable.
- This is the seed of the Phase 4 lead flow and a concrete artefact for the
  Trust Engine / TRiSM story: *AI generates → policy controls → human approves →
  system executes → audit trail records.*
