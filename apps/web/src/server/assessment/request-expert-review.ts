import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

/**
 * File an expert-review request for a low-confidence assessment (Slice A —
 * STEP 5). This is the honest "we can't confidently map this" path (CLAUDE.md
 * #2) — a trust feature, not a failure. No routing / notification yet: it writes
 * the row, flips the assessment status, and audits.
 *
 * Idempotent per (assessment, user): a second call returns the existing request.
 */

export class ExpertReviewError extends Error {}

export async function requestExpertReview(params: {
  assessmentId: string;
  userId: string;
  note?: string | undefined;
}): Promise<{ id: string; alreadyRequested: boolean }> {
  const { assessmentId, userId, note } = params;

  const assessment = await db.query.assessments.findFirst({
    where: and(
      eq(schema.assessments.id, assessmentId),
      eq(schema.assessments.userId, userId),
      isNull(schema.assessments.organizationId),
    ),
    columns: { id: true },
  });
  if (!assessment) {
    throw new ExpertReviewError("assessment not found");
  }

  const existing = await db.query.expertReviewRequests.findFirst({
    where: and(
      eq(schema.expertReviewRequests.assessmentId, assessmentId),
      eq(schema.expertReviewRequests.userId, userId),
    ),
    columns: { id: true },
  });
  if (existing) {
    return { id: existing.id, alreadyRequested: true };
  }

  const id = randomUUID();
  await db.batch([
    db.insert(schema.expertReviewRequests).values({
      id,
      assessmentId,
      userId,
      organizationId: null,
      note: note ?? null,
      status: "open",
    }),
    db
      .update(schema.assessments)
      .set({ status: "needs_expert_review", updatedAt: new Date() })
      .where(eq(schema.assessments.id, assessmentId)),
  ]);

  await recordAuditEvent({
    type: "expert_review.requested",
    actorId: userId,
    actorRole: null,
    tenant: `personal:${userId}`,
    resourceType: "assessment",
    resourceId: assessmentId,
    requestId: null,
    metadata: { expertReviewId: id },
  });

  return { id, alreadyRequested: false };
}
