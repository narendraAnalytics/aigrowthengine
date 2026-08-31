/**
 * MVP success criteria (Phase 0.7), from FinalRoadMap §8.
 *
 * These are INTERNAL OPERATING TARGETS, recalibrated once real data exists — not
 * industry-benchmark claims. Each criterion says exactly how it is measured
 * (which analytics events / audit event types / query), so the dashboard is
 * unambiguous to build.
 *
 * Kill criteria (roadmap Section 0): if after Sprint 7 `assessment_to_qualified`
 * is under ~0.10 and no pilot has closed, the problem is positioning/vertical,
 * not code — re-pick the vertical before Phase 6+.
 */

export const CRITERION_CATEGORIES = [
  "funnel",
  "quality",
  "ai",
  "security",
] as const;
export type CriterionCategory = (typeof CRITERION_CATEGORIES)[number];

export type Comparator = "gte" | "lte" | "eq";

export type SuccessCriterion = {
  id: string;
  label: string;
  category: CriterionCategory;
  target: number;
  comparator: Comparator;
  /** "ratio" (0..1), "count", or "percent" (0..100). */
  unit: "ratio" | "count" | "percent";
  /** How to compute it — event names / audit types / query description. */
  measurement: string;
};

export const SUCCESS_CRITERIA: readonly SuccessCriterion[] = [
  {
    id: "assessment_completion",
    label: "Assessment completion rate",
    category: "funnel",
    target: 0.5,
    comparator: "gte",
    unit: "ratio",
    measurement: "count(assessment_completed) / count(assessment_started)",
  },
  {
    id: "assessment_usefulness",
    label: "Assessment usefulness",
    category: "quality",
    target: 0.8,
    comparator: "gte",
    unit: "ratio",
    measurement:
      "count(assessment_usefulness_rated where useful = true) / count(assessment_usefulness_rated)",
  },
  {
    id: "capability_match_accuracy",
    label: "Capability-match accuracy",
    category: "ai",
    target: 0.9,
    comparator: "gte",
    unit: "ratio",
    measurement:
      "1 - (count(distinct assessment_id in ai_match_corrected) / count(distinct assessment_id in capability_match_shown, reviewed))",
  },
  {
    id: "assessment_to_qualified",
    label: "Assessment → qualified opportunity",
    category: "funnel",
    target: 0.2,
    comparator: "gte",
    unit: "ratio",
    measurement:
      "count(qualified_opportunity_created) / count(assessment_completed)",
  },
  {
    id: "qualified_to_consultation",
    label: "Qualified opportunity → consultation",
    category: "funnel",
    target: 0.3,
    comparator: "gte",
    unit: "ratio",
    measurement:
      "count(consultation_booked) / count(qualified_opportunity_created)",
  },
  {
    id: "consultation_to_pilot",
    label: "Consultation → proposal / pilot",
    category: "funnel",
    target: 0.25,
    comparator: "gte",
    unit: "ratio",
    measurement: "count(pilot_started) / count(consultation_booked)",
  },
  {
    id: "structured_output_success",
    label: "Structured AI-output success",
    category: "ai",
    target: 0.99,
    comparator: "gte",
    unit: "ratio",
    measurement:
      "1 - (count(structured_output_invalid) / count(model calls expecting structured output))",
  },
  {
    id: "critical_ai_hallucinations",
    label: "Critical AI hallucinations",
    category: "ai",
    target: 0,
    comparator: "eq",
    unit: "count",
    measurement: "count(ai_hallucination_flagged where severity = 'critical')",
  },
  {
    id: "unauthorized_tenant_access",
    label: "Unauthorized tenant access",
    category: "security",
    target: 0,
    comparator: "eq",
    unit: "count",
    measurement:
      "count of confirmed tenant-isolation violations (from security review + audit_events analysis)",
  },
  {
    id: "unauthorized_investor_access",
    label: "Unauthorized investor document access",
    category: "security",
    target: 0,
    comparator: "eq",
    unit: "count",
    measurement:
      "count of investor_room.document_viewed events where the viewer's level did not meet the document's required level",
  },
] as const;

export function evaluateCriterion(
  criterion: SuccessCriterion,
  value: number,
): { pass: boolean; value: number } {
  const pass =
    criterion.comparator === "gte"
      ? value >= criterion.target
      : criterion.comparator === "lte"
        ? value <= criterion.target
        : value === criterion.target;
  return { pass, value };
}
