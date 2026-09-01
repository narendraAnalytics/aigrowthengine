import { z } from "zod";

import { IDEA_DIMENSION_IDS, IDEA_SIGNAL_LEVELS } from "@/lib/idea";
import { ideaSignalsSchema } from "@/lib/idea/signals";

/**
 * The contract for what Groq is allowed to return for an idea assessment. The
 * model emits SIGNALS ONLY (CLAUDE.md #1): a level + rationale per dimension, a
 * plain-language summary, the single biggest risk, and a few illustrative AI
 * building blocks. It never returns a potential score or a BUILD/REFINE/… verdict.
 *
 * Two representations kept in lock-step by `idea-schema.test.ts`:
 *   - `ideaModelResponseSchema` — Zod, the REAL guarantee (re-validated before
 *     the deterministic verdict).
 *   - `buildIdeaJsonSchema()` — hand-written JSON Schema for Groq strict mode.
 */

export const IDEA_SIGNALS_SCHEMA_NAME = "idea_signals";

export const ideaModelResponseSchema = z
  .object({
    /** One { level, rationale } per evaluation dimension. */
    signals: ideaSignalsSchema,
    /** 2–4 sentence plain-language read-back of the idea and its potential. */
    summary: z.string().trim().min(1).max(2000),
    /** The single biggest risk to the idea, 1–2 sentences. */
    main_risk: z.string().trim().min(1).max(800),
    /**
     * 0–6 generic AI building blocks the solution could use (e.g. "intent
     * classification", "retrieval over a knowledge base"). Illustrative only —
     * the result page frames these as possibilities, not a delivery commitment.
     */
    ai_approaches: z.array(z.string().trim().min(1).max(120)).max(6),
  })
  .strict();

export type IdeaModelResponse = z.infer<typeof ideaModelResponseSchema>;

type JsonSchema = Record<string, unknown>;

const dimensionSignalJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["level", "rationale"],
  properties: {
    level: { type: "string", enum: [...IDEA_SIGNAL_LEVELS] },
    rationale: { type: "string" },
  },
};

/** JSON Schema handed to Groq. Kept structurally identical to the Zod schema. */
export function buildIdeaJsonSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["signals", "summary", "main_risk", "ai_approaches"],
    properties: {
      signals: {
        type: "object",
        additionalProperties: false,
        required: [...IDEA_DIMENSION_IDS],
        properties: Object.fromEntries(
          IDEA_DIMENSION_IDS.map((id) => [id, dimensionSignalJsonSchema]),
        ),
      },
      summary: { type: "string" },
      main_risk: { type: "string" },
      ai_approaches: { type: "array", items: { type: "string" } },
    },
  };
}
