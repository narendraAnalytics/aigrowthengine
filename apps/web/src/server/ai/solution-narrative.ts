import "server-only";

import { z } from "zod";

import { getCapability } from "@/lib/capabilities";

import { createNarrativeCompletion } from "./groq";
import { hashPrompt, logAiRun } from "./log";

import type { CapabilityMatch } from "@/lib/matching";

/**
 * The 2nd Groq call — "how we'd solve this" — grounded ONLY in the capabilities
 * the deterministic matcher already picked (CLAUDE.md #2: never invent a
 * solution). The model explains those capabilities in the client's context.
 *
 * Guardrails:
 *  - the prompt is fed ONLY the matched capability names + descriptions
 *  - it is told: no other tools, no timelines, no metrics/percentages, no pricing
 *  - the output is scrubbed — if it still leaks a number-with-unit, a percentage,
 *    or an ROI claim, we discard it and use the templated fallback
 *  - ANY failure (rate limit on the free tier, network, bad JSON) → templated
 *    fallback built from the capabilities' own library copy. The client never
 *    sees a broken result.
 */

export type SolutionNarrative = {
  summary: string;
  steps: string[];
  source: "ai" | "templated";
};

/** Persisted form: JSON in `assessment_results.solution_narrative`. */
export function serializeNarrative(n: SolutionNarrative): string {
  return JSON.stringify({ summary: n.summary, steps: n.steps });
}

export function parseNarrative(
  raw: string | null | undefined,
): { summary: string; steps: string[] } | null {
  if (!raw) return null;
  try {
    const parsed = z
      .object({ summary: z.string(), steps: z.array(z.string()) })
      .safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const narrativeSchema = z.object({
  summary: z.string().trim().min(1).max(900),
  steps: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
});

const NARRATIVE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "steps"],
  properties: {
    summary: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM_PROMPT = `You explain, in plain language, HOW a set of already-selected delivery capabilities would address a business's problem. You are writing for the business owner who submitted the problem.

Hard rules:
- Refer ONLY to the capabilities provided in the input. Never name any other product, tool, vendor, or model.
- Do NOT state timelines, durations, dates, weeks, or months.
- Do NOT state numbers with units, percentages, ROI, cost savings, or accuracy figures.
- Do NOT promise outcomes. Describe the approach, not the result.
- Second person ("you", "your team"). Concrete and specific to their problem.

Return JSON: { "summary": "2-3 sentences on the overall approach", "steps": ["3-5 short phrases, each one concrete action or stage"] }.`;

// number followed by a time/${unit} word, a percentage, or an ROI/savings claim
const LEAKAGE =
  /\b\d+(\.\d+)?\s*(%|percent|weeks?|months?|days?|hours?|x)\b|\broi\b|\bcost sav/i;

type NarrativeInput = {
  problemDescription: string;
  industry: string | null;
  matches: CapabilityMatch[];
};

export function templatedNarrative(
  matches: CapabilityMatch[],
): SolutionNarrative {
  if (matches.length === 0) {
    return {
      summary:
        "Your problem does not yet map cleanly to a capability we have delivered before. One of our specialists will review it and follow up to scope the right approach.",
      steps: [
        "A specialist reviews your submission",
        "We contact you to discuss options",
      ],
      source: "templated",
    };
  }
  const names = matches.map((m) => m.name);
  return {
    summary: `Based on what you described, ${
      names.length === 1
        ? "this capability applies"
        : "these capabilities apply"
    }: ${names.join(", ")}. Here is the shape of how we would approach it.`,
    steps: matches.map((m) => {
      const cap = getCapability(m.capabilityId);
      return cap ? `${m.name} — ${cap.oneLiner}` : m.name;
    }),
    source: "templated",
  };
}

export async function generateSolutionNarrative(
  input: NarrativeInput,
  ctx: { userId: string; assessmentId: string },
): Promise<SolutionNarrative> {
  if (input.matches.length === 0) return templatedNarrative(input.matches);

  const capabilityBlock = input.matches
    .map((m) => {
      const cap = getCapability(m.capabilityId);
      return `- ${m.name}: ${cap?.description ?? m.rationale}`;
    })
    .join("\n");

  const userPrompt = `The business's problem, in their words:
"""
${input.problemDescription}
"""
Industry: ${input.industry ?? "not specified"}

Selected capabilities (use ONLY these):
${capabilityBlock}`;

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];
  const promptHash = hashPrompt(`${SYSTEM_PROMPT}\n\n${userPrompt}`);

  try {
    const completion = await createNarrativeCompletion(
      messages,
      NARRATIVE_JSON_SCHEMA,
    );
    const parsed = narrativeSchema.safeParse(JSON.parse(completion.content));
    if (!parsed.success) throw new Error("narrative failed schema validation");

    const combined = `${parsed.data.summary} ${parsed.data.steps.join(" ")}`;
    if (LEAKAGE.test(combined)) {
      await logAiRun({
        userId: ctx.userId,
        assessmentId: ctx.assessmentId,
        purpose: "solution_narrative",
        model: completion.model,
        promptHash,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        latencyMs: completion.latencyMs,
        outcome: "failed",
      });
      return templatedNarrative(input.matches);
    }

    await logAiRun({
      userId: ctx.userId,
      assessmentId: ctx.assessmentId,
      purpose: "solution_narrative",
      model: completion.model,
      promptHash,
      promptTokens: completion.promptTokens,
      completionTokens: completion.completionTokens,
      latencyMs: completion.latencyMs,
      outcome: "ok",
    });
    return { ...parsed.data, source: "ai" };
  } catch {
    // Free-tier rate limit / network / bad output — never block the result.
    return templatedNarrative(input.matches);
  }
}
