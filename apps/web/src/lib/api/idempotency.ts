/**
 * Idempotency convention for v1 (Phase 0.4).
 *
 * Any POST that creates billable or AI work (submitting an assessment, requesting
 * an expert review) MUST accept an `Idempotency-Key` header. The client sends a
 * fresh UUID per logical operation and retries with the SAME key on network
 * failure.
 *
 * Server contract:
 *  - First request for a key: process normally, store (key -> request fingerprint
 *    + response) with a TTL (recommended 24h).
 *  - Retry with the same key AND the same request body: return the stored response.
 *  - Same key but a DIFFERENT body: reject with `conflict` (409).
 *  - Missing key on a mutation that requires one: reject with `validation_error`.
 *
 * The persistent key store is implemented alongside the endpoints (Phase 3); this
 * module only fixes the header name, TTL and fingerprinting rule so both sides agree.
 */

import { createHash } from "node:crypto";

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/** Recommended retention for stored idempotency records. */
export const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24h

/** Endpoints (by method + path) that require an Idempotency-Key. */
export const IDEMPOTENT_ENDPOINTS = [
  "POST /api/v1/assessments",
  "POST /api/v1/assessments/:id/expert-review",
] as const;

/**
 * Stable fingerprint of a request body, used to detect a key being reused with a
 * different payload. Order-independent for plain JSON objects.
 */
export function fingerprintBody(body: unknown): string {
  return createHash("sha256")
    .update(stableStringify(body))
    .digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}
