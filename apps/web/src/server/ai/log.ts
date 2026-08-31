import "server-only";

import { createHash } from "node:crypto";

import * as Sentry from "@sentry/nextjs";

import { recordAuditEvent } from "@/server/audit/record";

/**
 * Lightweight observability for outbound Groq calls (Slice A decision — the full
 * `ai_runs` table is deferred to Phase 3). Every call is written as an
 * `ai_gateway.request` audit row and a Sentry breadcrumb, carrying model,
 * latency, token counts, outcome and a SHA-256 of the prompt (never the prompt
 * itself — it may echo the business's problem text).
 */

export type AiRunOutcome = "ok" | "schema_repair" | "failed";

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

export type AiRunRecord = {
  userId: string;
  /** e.g. "assessment_signals". */
  purpose: string;
  model: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  outcome: AiRunOutcome;
  assessmentId?: string | null;
};

export async function logAiRun(run: AiRunRecord): Promise<void> {
  const metadata = {
    purpose: run.purpose,
    model: run.model,
    prompt_hash: run.promptHash,
    prompt_tokens: run.promptTokens,
    completion_tokens: run.completionTokens,
    latency_ms: run.latencyMs,
    outcome: run.outcome,
  };

  Sentry.addBreadcrumb({
    category: "ai",
    type: "http",
    level: run.outcome === "failed" ? "error" : "info",
    message: `groq ${run.purpose} ${run.outcome}`,
    data: metadata,
  });

  await recordAuditEvent({
    type: "ai_gateway.request",
    actorId: run.userId,
    actorRole: null,
    tenant: `personal:${run.userId}`,
    resourceType: "ai_run",
    resourceId: run.assessmentId ?? null,
    requestId: null,
    metadata,
  });
}
