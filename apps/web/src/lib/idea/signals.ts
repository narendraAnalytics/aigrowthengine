import { z } from "zod";

import { IDEA_DIMENSION_IDS, IDEA_SIGNAL_LEVELS } from "./dimensions";

/**
 * The SIGNAL contract — what the LLM is allowed to return for an idea assessment.
 *
 * One { level, rationale } per dimension. The model never returns a score or a
 * verdict; `computeIdeaVerdict()` (./verdict.ts) does, deterministically.
 */

export const ideaDimensionSignalSchema = z.object({
  level: z.enum(IDEA_SIGNAL_LEVELS),
  /** One or two sentences of evidence drawn from the founder's answers. */
  rationale: z.string().min(1).max(600),
});
export type IdeaDimensionSignal = z.infer<typeof ideaDimensionSignalSchema>;

/** A record with exactly one signal per dimension id. */
export const ideaSignalsSchema = z.object(
  Object.fromEntries(
    IDEA_DIMENSION_IDS.map((id) => [id, ideaDimensionSignalSchema]),
  ) as Record<
    (typeof IDEA_DIMENSION_IDS)[number],
    typeof ideaDimensionSignalSchema
  >,
);
export type IdeaSignals = z.infer<typeof ideaSignalsSchema>;

/**
 * Parse untrusted model output into IdeaSignals. Throws (ZodError) on any missing
 * dimension, unknown level, or missing rationale — the caller treats that as a
 * failed assessment, not a zero score.
 */
export function parseIdeaSignals(raw: unknown): IdeaSignals {
  return ideaSignalsSchema.parse(raw);
}
