/**
 * Data classification + retention (Phase 0.5).
 *
 * Every stored field maps to a class; each class has a default retention window.
 * India DPDP / GDPR-ready posture: minimise, classify, delete on schedule, honour
 * erasure requests.
 *
 * TODO(legal/DPDP): retention windows below are engineering defaults. Confirm with
 * counsel before go-live, especially `confidential` (assessment content) and the
 * erasure SLA.
 */

export const DATA_CLASSES = [
  "public", // safe to expose publicly (marketing copy, capability names)
  "internal", // internal-only, low sensitivity (aggregate metrics, config)
  "confidential", // business-sensitive customer data (assessment answers, CRM notes)
  "restricted", // highest sensitivity (auth secrets, investor cap table, audit log)
] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

/** Default retention in days. `null` = retain while the owning record lives. */
export const RETENTION_DAYS: Record<DataClass, number | null> = {
  public: null,
  internal: 365,
  confidential: 365 * 2, // assessment / CRM history — TODO(legal) confirm
  restricted: 365 * 7, // audit & financial records — TODO(legal) confirm
};

/** Whether a class may contain personal data (PII) about an individual. */
export const MAY_CONTAIN_PII: Record<DataClass, boolean> = {
  public: false,
  internal: false,
  confidential: true,
  restricted: true,
};

/**
 * Classification of known fields in the current schema. Keyed by
 * `table.column`. Extend as tables are added; check:security asserts the
 * assessment-domain tables are all represented.
 */
export const FIELD_CLASSIFICATION: Record<string, DataClass> = {
  "users.email": "confidential",
  "users.first_name": "confidential",
  "users.last_name": "confidential",
  "users.image_url": "internal",
  "organizations.name": "internal",
  "organizations.slug": "internal",

  "assessments.answers": "confidential",
  "assessment_results.signals": "confidential",
  "assessment_results.summary": "confidential",
  "assessment_results.problem_types": "internal",
  "assessment_results.industry": "internal",
  "assessment_results.lead_score": "confidential",
  "capability_matches.rationale": "confidential",
  "expert_review_requests.note": "confidential",

  "audit_events.actor_id": "restricted",
  "audit_events.metadata": "restricted",
};

export function classifyField(tableColumn: string): DataClass | undefined {
  return FIELD_CLASSIFICATION[tableColumn];
}

export function retentionForField(tableColumn: string): number | null | undefined {
  const cls = classifyField(tableColumn);
  return cls ? RETENTION_DAYS[cls] : undefined;
}
