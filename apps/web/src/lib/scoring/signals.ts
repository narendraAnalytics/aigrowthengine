import { z } from "zod";

import { FACTOR_IDS, SIGNAL_LEVELS } from "./factors";

/**
 * The SIGNAL contract — what the LLM is allowed to return for scoring.
 *
 * The model assesses each factor as a level + a short rationale (its evidence).
 * It never returns points or a total. The backend validates this shape, may
 * override `solution_fit` from the deterministic capability match, then calls
 * computeLeadScore() (./score.ts).
 *
 * Use this schema as the structured-output contract when calling the LLM
 * (Groq `response_format: json_schema`, strict), and to validate the response
 * before scoring. Provider: docs/adr/0001-ai-provider-groq.md.
 */

export const factorSignalSchema = z.object({
  level: z.enum(SIGNAL_LEVELS),
  /** One or two sentences of evidence from the assessment answers. */
  rationale: z.string().min(1).max(600),
});
export type FactorSignal = z.infer<typeof factorSignalSchema>;

/** A record with exactly one signal per factor id. */
export const leadSignalsSchema = z.object(
  Object.fromEntries(
    FACTOR_IDS.map((id) => [id, factorSignalSchema]),
  ) as Record<(typeof FACTOR_IDS)[number], typeof factorSignalSchema>,
);
export type LeadSignals = z.infer<typeof leadSignalsSchema>;

/**
 * Parse untrusted model output into LeadSignals. Throws (ZodError) on any missing
 * factor, unknown level, or missing rationale — caller should treat that as a
 * failed assessment, not a zero score.
 */
export function parseLeadSignals(raw: unknown): LeadSignals {
  return leadSignalsSchema.parse(raw);
}
