import "server-only";

import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";
import {
  sendInvestorConfirmation,
  sendInvestorTeamAlert,
} from "@/server/email/investor-emails";

import type { SubmitInvestorInterest } from "@/lib/investor";

/**
 * Capture a "Request Investor Access" submission from the public Investor Room.
 *
 * Writes one `investor_interest_requests` row, records an audit event, then
 * auto-sends the confirmation + team-alert emails (best-effort — a delivery
 * failure is recorded but never fails the request). No LLM is involved.
 */

export type CreateInvestorRequestInput = {
  data: SubmitInvestorInterest;
  userId: string | null;
  requestId: string | null;
};

export async function createInvestorRequest(
  input: CreateInvestorRequestInput,
): Promise<{ id: string }> {
  const { data, userId, requestId } = input;

  const [created] = await db
    .insert(schema.investorInterestRequests)
    .values({
      clerkUserId: userId,
      fullName: data.fullName,
      workEmail: data.workEmail,
      company: data.company,
      role: data.role ?? null,
      interests: data.interests,
      stage: data.stage ?? null,
      geography: data.geography ?? null,
      learnMore: data.learnMore?.trim() ? data.learnMore.trim() : null,
    })
    .returning({ id: schema.investorInterestRequests.id });

  if (!created) throw new Error("could not create the investor request row");

  await recordAuditEvent({
    type: "investor_interest.submitted",
    actorId: userId,
    actorRole: null,
    tenant: userId ? `personal:${userId}` : null,
    resourceType: "investor_interest",
    resourceId: created.id,
    requestId,
    metadata: {
      role: data.role ?? null,
      stage: data.stage ?? null,
      geography: data.geography ?? null,
      interests: data.interests,
    },
  });

  await Promise.allSettled([
    sendInvestorConfirmation(created.id),
    sendInvestorTeamAlert(created.id),
  ]);

  return { id: created.id };
}
