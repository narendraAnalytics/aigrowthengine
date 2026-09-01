import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import type { IdeaLeadContact } from "@/lib/idea";

/**
 * Attach lead contact details to an idea assessment after the founder has seen
 * the result and clicked "talk to our team". Ownership-checked. Idempotent —
 * a second submit just overwrites the stored details.
 */

export class IdeaContactError extends Error {}

export async function addIdeaContact(params: {
  ideaAssessmentId: string;
  userId: string;
  contact: IdeaLeadContact;
}): Promise<void> {
  const { ideaAssessmentId, userId, contact } = params;

  const row = await db.query.ideaAssessments.findFirst({
    where: and(
      eq(schema.ideaAssessments.id, ideaAssessmentId),
      eq(schema.ideaAssessments.userId, userId),
      isNull(schema.ideaAssessments.organizationId),
    ),
    columns: { id: true },
  });
  if (!row) throw new IdeaContactError("idea assessment not found");

  await db
    .update(schema.ideaAssessments)
    .set({
      leadName: contact.name,
      leadCompany: contact.company ?? null,
      leadPhone: contact.phone ?? null,
      leadNote: contact.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.ideaAssessments.id, ideaAssessmentId));

  await recordAuditEvent({
    type: "idea_assessment.contact_added",
    actorId: userId,
    actorRole: null,
    tenant: `personal:${userId}`,
    resourceType: "idea_assessment",
    resourceId: ideaAssessmentId,
    requestId: null,
    metadata: {
      hasCompany: contact.company != null,
      hasPhone: contact.phone != null,
    },
  });
}
