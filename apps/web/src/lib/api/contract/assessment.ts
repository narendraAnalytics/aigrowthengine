import { z } from "zod";
import {
  ASSESSMENT_QUESTIONS,
  type AssessmentQuestion,
} from "@/lib/assessment/questions";
import { industrySchema, problemTypeSchema } from "@/lib/capabilities/schema";
import { FACTOR_IDS, SIGNAL_LEVELS } from "@/lib/scoring/factors";

/**
 * v1 API contract for the assessment endpoints (Phase 0.4).
 *
 *   POST /api/v1/assessments                  submit answers        (Idempotency-Key)
 *   GET  /api/v1/assessments/:id              status + summary
 *   GET  /api/v1/assessments/:id/result       score + matches
 *   POST /api/v1/assessments/:id/expert-review request expert help  (Idempotency-Key)
 *
 * The submit request schema is DERIVED from ASSESSMENT_QUESTIONS so the API and
 * the form never drift.
 */

function answerSchemaForQuestion(q: AssessmentQuestion): z.ZodTypeAny {
  switch (q.type) {
    case "long_text":
      return z.string().trim().min(1).max(5000);
    case "short_text":
      return z.string().trim().min(1).max(500);
    case "single_select": {
      const values = (q.options ?? []).map((o) => o.value);
      return z.enum(values as [string, ...string[]]);
    }
    case "multi_select": {
      const values = (q.options ?? []).map((o) => o.value);
      return z.array(z.enum(values as [string, ...string[]])).min(0);
    }
  }
}

const answersShape: Record<string, z.ZodTypeAny> = {};
for (const q of ASSESSMENT_QUESTIONS) {
  const base = answerSchemaForQuestion(q);
  answersShape[q.id] = q.required ? base : base.optional();
}

export const submitAssessmentRequestSchema = z.object({
  answers: z.object(answersShape).strict(),
});
export type SubmitAssessmentRequest = z.infer<
  typeof submitAssessmentRequestSchema
>;

export const assessmentStatusSchema = z.enum([
  "submitted",
  "analyzing",
  "scored",
  "needs_expert_review",
  "failed",
]);

export const assessmentSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  status: assessmentStatusSchema,
  created_at: z.string().datetime(),
  /** Present once status is "scored" or "needs_expert_review". */
  result_available: z.boolean(),
});
export type AssessmentSummaryResponse = z.infer<
  typeof assessmentSummaryResponseSchema
>;

const scoreBreakdownItemSchema = z.object({
  id: z.enum(FACTOR_IDS),
  label: z.string(),
  weight: z.number(),
  level: z.enum(SIGNAL_LEVELS),
  points: z.number(),
  rationale: z.string(),
});

const capabilityMatchResponseSchema = z.object({
  capability_id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1),
  match_class: z.enum(["strong", "partial", "none"]),
  rationale: z.string().nullable(),
  rank: z.number().int(),
});

export const assessmentResultResponseSchema = z.object({
  assessment_id: z.string().uuid(),
  problem_types: z.array(problemTypeSchema),
  industry: industrySchema.nullable(),
  lead_score: z.number().int().min(0).max(100),
  score_band: z.enum(["high", "medium", "low"]),
  scoring_model_version: z.string(),
  breakdown: z.array(scoreBreakdownItemSchema).length(FACTOR_IDS.length),
  matches: z.array(capabilityMatchResponseSchema),
  no_confident_match: z.boolean(),
  summary: z.string().nullable(),
});
export type AssessmentResultResponse = z.infer<
  typeof assessmentResultResponseSchema
>;

export const expertReviewRequestSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});
export type ExpertReviewRequest = z.infer<typeof expertReviewRequestSchema>;

export const expertReviewResponseSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  status: z.enum(["open", "contacted", "closed"]),
  created_at: z.string().datetime(),
});
export type ExpertReviewResponse = z.infer<typeof expertReviewResponseSchema>;
