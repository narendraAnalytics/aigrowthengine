import "server-only";

import { eq } from "drizzle-orm";

import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";
import {
  sendVoiceConfirmation,
  sendVoiceTeamAlert,
} from "@/server/email/voice-emails";

import {
  dispatchVoiceCall,
  voiceServiceConfigured,
} from "./voice-service-client";

import type { SubmitCallRequest } from "@/lib/voice";

/**
 * Capture a "Connect Me" submission and kick off the AI follow-up call.
 *
 * 1. Insert one `voice_call_requests` row (consent already validated true).
 * 2. Audit + auto-send confirmation & team-alert emails (best-effort).
 * 3. Hand the request to the FastAPI voice service (best-effort — a failure is
 *    recorded on the row + audit, never surfaced to the user; Sarvam is out of
 *    the request path by design).
 */

export type CreateCallRequestInput = {
  data: SubmitCallRequest;
  userId: string | null;
};

export async function createCallRequest(
  input: CreateCallRequestInput,
): Promise<{ id: string; requestId: string }> {
  const { data, userId } = input;

  const [created] = await db
    .insert(schema.voiceCallRequests)
    .values({
      clerkUserId: userId,
      fullName: data.fullName,
      company: data.company ?? null,
      phoneE164: data.phone,
      email: data.email ?? null,
      requirement: data.requirement,
      consent: data.consent,
    })
    .returning({
      id: schema.voiceCallRequests.id,
      requestId: schema.voiceCallRequests.requestId,
    });

  if (!created) throw new Error("could not create the voice call request row");

  await recordAuditEvent({
    type: "voice_call.requested",
    actorId: userId,
    actorRole: null,
    tenant: userId ? `personal:${userId}` : null,
    resourceType: "voice_call_request",
    resourceId: created.requestId,
    requestId: null,
    metadata: {
      hasEmail: Boolean(data.email),
      hasCompany: Boolean(data.company),
    },
  });

  await Promise.allSettled([
    sendVoiceConfirmation(created.requestId),
    sendVoiceTeamAlert(created.requestId),
  ]);

  await dispatchToVoiceService({
    requestId: created.requestId,
    phone: data.phone,
    fullName: data.fullName,
    company: data.company ?? null,
    requirement: data.requirement,
  });

  return { id: created.id, requestId: created.requestId };
}

async function dispatchToVoiceService(args: {
  requestId: string;
  phone: string;
  fullName: string;
  company: string | null;
  requirement: string;
}): Promise<void> {
  if (!voiceServiceConfigured()) {
    await db
      .update(schema.voiceCallRequests)
      .set({
        status: "failed",
        error: "voice service not configured",
        updatedAt: new Date(),
      })
      .where(eq(schema.voiceCallRequests.requestId, args.requestId));
    await recordAuditEvent({
      type: "voice_call.dispatch_failed",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "voice_call_request",
      resourceId: args.requestId,
      requestId: null,
      metadata: { reason: "not_configured" },
    });
    return;
  }

  try {
    const { attemptId } = await dispatchVoiceCall(args);
    await db
      .update(schema.voiceCallRequests)
      .set({
        status: "calling",
        attemptId: attemptId,
        calledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.voiceCallRequests.requestId, args.requestId));
    await recordAuditEvent({
      type: "voice_call.dispatched",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "voice_call_request",
      resourceId: args.requestId,
      requestId: null,
      metadata: { attemptId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.voiceCallRequests)
      .set({ status: "failed", error: message, updatedAt: new Date() })
      .where(eq(schema.voiceCallRequests.requestId, args.requestId));
    await recordAuditEvent({
      type: "voice_call.dispatch_failed",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "voice_call_request",
      resourceId: args.requestId,
      requestId: null,
      metadata: { error: message },
    });
  }
}
