import "server-only";

import { eq } from "drizzle-orm";

import { isVoiceCallOutcome, type VoiceCallOutcome } from "@/lib/voice";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";
import { sendVoiceTeamSummary } from "@/server/email/voice-emails";

/**
 * Record the outcome the FastAPI voice service reports after a Sarvam call ends.
 *
 * Idempotent: the voice service (and Sarvam) may retry the webhook. If the row
 * is already in a terminal state (`completed` / `failed`) we no-op so a retry
 * never sends a second summary email or overwrites the first result.
 */

export type RecordCallResultInput = {
  requestId: string;
  outcome: string;
  callStatus?: string | null;
  durationSeconds?: number | null;
  transcript?: { role: string; text: string }[] | null;
  summary?: string | null;
};

export type RecordCallResultResult =
  { ok: true; deduped: boolean } | { ok: false; reason: "not_found" };

export async function recordCallResult(
  input: RecordCallResultInput,
): Promise<RecordCallResultResult> {
  const row = await db.query.voiceCallRequests.findFirst({
    where: eq(schema.voiceCallRequests.requestId, input.requestId),
  });
  if (!row) return { ok: false, reason: "not_found" };

  if (row.status === "completed" || row.status === "failed") {
    return { ok: true, deduped: true };
  }

  const outcome: VoiceCallOutcome | null = isVoiceCallOutcome(input.outcome)
    ? input.outcome
    : null;
  const connected = input.callStatus === "connected";

  await db
    .update(schema.voiceCallRequests)
    .set({
      status: connected ? "completed" : "failed",
      outcome,
      callStatus: input.callStatus ?? null,
      durationSeconds: input.durationSeconds ?? null,
      transcript: input.transcript ?? null,
      summary: input.summary ?? null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.voiceCallRequests.requestId, input.requestId));

  await recordAuditEvent({
    type: "voice_call.completed",
    actorId: null,
    actorRole: null,
    tenant: null,
    resourceType: "voice_call_request",
    resourceId: input.requestId,
    requestId: null,
    metadata: {
      outcome: outcome ?? input.outcome,
      callStatus: input.callStatus ?? null,
      durationSeconds: input.durationSeconds ?? null,
    },
  });

  await sendVoiceTeamSummary(input.requestId).catch(() => {});

  return { ok: true, deduped: false };
}
