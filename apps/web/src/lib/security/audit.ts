import { z } from "zod";

/**
 * Audit event catalogue (Phase 0.5, CLAUDE.md #8).
 *
 * Every sensitive action writes ONE append-only `audit_events` row. This module
 * defines the allowed event types + their metadata, and the shape of an event.
 * The write path (repository + table) lives in @/server; this stays pure.
 */

export const AUDIT_CATEGORIES = [
  "assessment",
  "capability",
  "crm",
  "investor_room",
  "access_control",
  "data_lifecycle",
  "ai_gateway",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export type AuditEventDef = {
  type: string;
  category: AuditCategory;
  description: string;
  /** Retention for the audit row itself. */
  retentionDays: number;
  /** Whether the event's metadata is expected to reference personal data. */
  piiInvolved: boolean;
};

const AUDIT_RETENTION_DEFAULT = 365 * 7; // align with `restricted` class

function def(
  type: string,
  category: AuditCategory,
  description: string,
  piiInvolved = false,
  retentionDays = AUDIT_RETENTION_DEFAULT,
): AuditEventDef {
  return { type, category, description, piiInvolved, retentionDays };
}

export const AUDIT_EVENTS: readonly AuditEventDef[] = [
  def(
    "assessment.submitted",
    "assessment",
    "A prospect submitted assessment answers",
    true,
  ),
  def(
    "assessment.scored",
    "assessment",
    "The engine produced a result + lead score",
  ),
  def("assessment.failed", "assessment", "The assessment pipeline failed"),
  def(
    "expert_review.requested",
    "assessment",
    "A prospect requested an expert review",
    true,
  ),
  def(
    "expert_review.status_changed",
    "assessment",
    "Staff changed an expert-review status",
  ),

  def(
    "assessment_email.team_alert_sent",
    "assessment",
    "Lead-alert email sent to the internal team",
    true,
  ),
  def(
    "assessment_email.team_alert_failed",
    "assessment",
    "Lead-alert email to the internal team failed to send",
  ),
  def(
    "assessment_email.client_drafted",
    "assessment",
    "Client result email drafted, awaiting staff approval",
    true,
  ),
  def(
    "assessment_email.client_approved",
    "assessment",
    "Staff approved the client result email for sending (recorded approval)",
    true,
  ),
  def(
    "assessment_email.client_sent",
    "assessment",
    "Approved client result email sent to the prospect",
    true,
  ),
  def(
    "assessment_email.client_failed",
    "assessment",
    "Client result email failed to send",
    true,
  ),

  def(
    "idea_assessment.submitted",
    "assessment",
    "A founder submitted an AI idea for assessment",
    true,
  ),
  def(
    "idea_assessment.scored",
    "assessment",
    "The engine produced an idea verdict + potential score",
  ),
  def(
    "idea_assessment.failed",
    "assessment",
    "The idea-assessment pipeline failed",
  ),
  def(
    "idea_assessment.contact_added",
    "assessment",
    "A founder added lead contact details after seeing the idea result",
    true,
  ),
  def(
    "idea_assessment_email.client_sent",
    "assessment",
    "Idea result email sent to the founder",
    true,
  ),
  def(
    "idea_assessment_email.client_failed",
    "assessment",
    "Idea result email failed to send",
    true,
  ),
  def(
    "idea_assessment_email.team_alert_sent",
    "assessment",
    "Idea lead-alert email sent to the internal team",
    true,
  ),
  def(
    "idea_assessment_email.team_alert_failed",
    "assessment",
    "Idea lead-alert email to the internal team failed to send",
  ),

  def(
    "capability.created",
    "capability",
    "A capability was added to the library",
  ),
  def("capability.updated", "capability", "A capability was edited"),

  def(
    "lead.score_overridden",
    "crm",
    "Staff manually overrode a lead score (reason recorded)",
    true,
  ),
  def("crm.record_exported", "crm", "CRM data was exported", true),

  def(
    "investor_room.access_granted",
    "investor_room",
    "An investor was granted an access level",
    true,
  ),
  def(
    "investor_room.access_revoked",
    "investor_room",
    "An investor's access was revoked",
    true,
  ),
  def(
    "investor_room.document_viewed",
    "investor_room",
    "An investor viewed a restricted document",
    true,
  ),

  def(
    "access_control.role_assigned",
    "access_control",
    "A user's role was changed",
    true,
  ),
  def(
    "access_control.user_deactivated",
    "access_control",
    "A user account was deactivated",
    true,
  ),

  def(
    "data_lifecycle.erasure_requested",
    "data_lifecycle",
    "A data-subject erasure request was received",
    true,
  ),
  def(
    "data_lifecycle.record_deleted",
    "data_lifecycle",
    "A record was hard-deleted per policy",
    true,
  ),

  def(
    "ai_gateway.request",
    "ai_gateway",
    "An outbound model call was made (model, tokens, purpose)",
  ),
  def(
    "ai_gateway.blocked",
    "ai_gateway",
    "A model call or output was blocked by a guardrail",
  ),
] as const;

export const AUDIT_EVENT_TYPES = AUDIT_EVENTS.map((e) => e.type);
const AUDIT_TYPE_SET = new Set<string>(AUDIT_EVENT_TYPES);

export function isKnownAuditEvent(type: string): boolean {
  return AUDIT_TYPE_SET.has(type);
}

export function auditEventDef(type: string): AuditEventDef | undefined {
  return AUDIT_EVENTS.find((e) => e.type === type);
}

/** Shape written to `audit_events`. `tenant` is org id or `personal:<userId>`. */
export const auditEventSchema = z.object({
  type: z.string().refine(isKnownAuditEvent, "unknown audit event type"),
  actorId: z.string().nullable(), // null for system-initiated events
  actorRole: z.string().nullable(),
  tenant: z.string().nullable(), // organization_id, or `personal:<userId>`, or null
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  requestId: z.string().nullable(),
  at: z.date(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;
