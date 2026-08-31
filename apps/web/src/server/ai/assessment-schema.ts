import { z } from "zod";

import { problemTypeSchema, PROBLEM_TYPES } from "@/lib/capabilities";
import { FACTOR_IDS, SIGNAL_LEVELS } from "@/lib/scoring/factors";
import { leadSignalsSchema } from "@/lib/scoring/signals";

/**
 * The contract for what Groq is allowed to return for an assessment (Slice A —
 * STEP 1). The model emits SIGNALS ONLY (CLAUDE.md #1): a level + rationale per
 * scoring factor, a list of problem-type tags, and a plain-language summary. It
 * never returns points, a total score, or a capability id.
 *
 * Two representations, kept in lock-step by `assessment-schema.test.ts`:
 *   - `assessmentModelResponseSchema` — Zod, the REAL guarantee. Groq's strict
 *     mode occasionally slips (community report), so every response is
 *     re-validated here before scoring.
 *   - `buildAssessmentJsonSchema()` — a hand-written JSON Schema for Groq's
 *     `response_format: { type: "json_schema", strict: true }`. Hand-written
 *     (not generated) so it satisfies strict-mode rules exactly: every property
 *     in `required`, `additionalProperties: false` everywhere.
 */

export const ASSESSMENT_SIGNALS_SCHEMA_NAME = "assessment_signals";

export const assessmentModelResponseSchema = z
  .object({
    /** Controlled-vocabulary tags. Unknown values are dropped downstream too. */
    problem_types: z.array(problemTypeSchema).max(8),
    /** One { level, rationale } per scoring factor. `solution_fit` is
     *  overridden from the deterministic matcher before scoring. */
    signals: leadSignalsSchema,
    /** 2–4 sentence plain-language read-back of the opportunity. */
    summary: z.string().trim().min(1).max(2000),
  })
  .strict();

export type AssessmentModelResponse = z.infer<
  typeof assessmentModelResponseSchema
>;

type JsonSchema = Record<string, unknown>;

const factorSignalJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["level", "rationale"],
  properties: {
    level: { type: "string", enum: [...SIGNAL_LEVELS] },
    rationale: { type: "string" },
  },
};

/** JSON Schema handed to Groq. Kept structurally identical to the Zod schema. */
export function buildAssessmentJsonSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["problem_types", "signals", "summary"],
    properties: {
      problem_types: {
        type: "array",
        items: { type: "string", enum: [...PROBLEM_TYPES] },
      },
      signals: {
        type: "object",
        additionalProperties: false,
        required: [...FACTOR_IDS],
        properties: Object.fromEntries(
          FACTOR_IDS.map((id) => [id, factorSignalJsonSchema]),
        ),
      },
      summary: { type: "string" },
    },
  };
}
