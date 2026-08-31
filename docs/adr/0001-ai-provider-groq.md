# ADR 0001 — LLM provider: Groq (`openai/gpt-oss-120b`)

**Status:** accepted · **Date:** 2026-08-31 · Supersedes the earlier "Google Gemini" choice

## Context

The assessment engine (Phase 3) sends a business problem to an LLM and gets back
**signals only** — a problem classification plus `{level, rationale}` per scoring
factor. The backend then computes the score with a deterministic pure function
(architecture rule #1). The LLM never returns a score or a capability it invented.

Requirements for the provider:

- Reliable **strict** structured JSON output (the signal contract must validate).
- Good reasoning on messy, plain-language business problems.
- Low cost per assessment (assessments are free; the pilot is the revenue).
- A prompt-injection screen for the public free-text fields (Phase 3.3).

At the time of this ADR **no LLM SDK code exists yet** — the switch is docs,
comments, and env scaffolding only.

## Decision

Use **Groq** with model **`openai/gpt-oss-120b`**.

- **SDK:** `groq` (Python, OpenAI-compatible chat completions).
- **Structured output:** `response_format={"type":"json_schema","json_schema":{"name":..., "strict": true, "schema": <pydantic-generated>}}`.
  Strict mode requires every field `required`, `additionalProperties: false`, and
  optional fields modelled as `["<type>", "null"]`. Pydantic v2 generates this.
- **Prompt-injection screen:** `meta-llama/llama-prompt-guard-2-86m` (a classifier,
  not a generator) runs on user free-text before the main call.
- **Model as config:** `GROQ_MODEL` env var (defaults to `openai/gpt-oss-120b`)
  so `openai/gpt-oss-20b` can be A/B'd against real assessments later.
- Re-validate every response with Pydantic even though strict mode claims 100%
  adherence (rule: trust neither side).

## Rationale

| | `gpt-oss-120b` | `gpt-oss-20b` |
|---|---|---|
| Strict JSON | yes | yes |
| Reasoning | ≈ OpenAI o4-mini | ≈ OpenAI o3-mini |
| Price /1M tok (in/out) | $0.15 / $0.60 | ~$0.10 |
| Output speed | ~500 t/s | ~940 t/s |

A single assessment is a few-thousand-token call → **~$0.005 on 120b**. The
reasoning gap matters more than the latency saving for a one-shot assessment that
feeds a sales conversation, so 120b is the default. 20b stays one env var away.

## Consequences

- Phase 3 AI layer targets the `groq` SDK, not `google-genai`.
- `GROQ_API_KEY` becomes a **required** server env var when Phase 3 lands (optional
  until then). `GROQ_MODEL` optional.
- The capability library (`apps/web/src/lib/capabilities/data.ts`) still lists
  "Google Gemini" as a technology used in **past client deliveries** — those
  describe real projects and are unaffected by the platform's own provider choice.
- Not chosen: Gemini (`response_schema` is comparable, but Groq is cheaper and
  faster for open models and the team already has Groq access), direct OpenAI
  (cost), self-hosted (ops burden pre-revenue).
- Revisit if: strict-mode model support regresses, Groq rate limits bite at
  scale, or a capability needs long-context / vision beyond gpt-oss.
