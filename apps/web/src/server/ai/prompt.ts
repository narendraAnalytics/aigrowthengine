import {
  ASSESSMENT_QUESTIONS,
  type AssessmentQuestion,
} from "@/lib/assessment/questions";
import { PROBLEM_TYPES } from "@/lib/capabilities";
import { FACTORS, SIGNAL_LEVELS } from "@/lib/scoring/factors";

import type { SubmitAssessmentRequest } from "@/lib/api/contract/assessment";

/**
 * Prompt construction for the assessment Groq call (Slice A — STEP 1).
 *
 * The model is asked for SIGNALS ONLY: problem-type tags from a fixed
 * vocabulary, a { level, rationale } per scoring factor against the written
 * rubric, and a short summary. It is explicitly told NOT to produce a score and
 * NOT to name any solution or product — scoring is deterministic (score.ts) and
 * capability matching is deterministic (match-capabilities.ts).
 *
 * The intake questions collect no contact PII; keep it that way for the slice so
 * nothing sensitive is ever sent to Groq (CLAUDE.md).
 */

type Answers = SubmitAssessmentRequest["answers"];

const factorRubricBlock = FACTORS.map((f) => {
  const levels = SIGNAL_LEVELS.map(
    (lvl) => `      ${lvl}: ${f.rubric[lvl]}`,
  ).join("\n");
  return `  - ${f.id} (${f.label}): ${f.description}\n${levels}`;
}).join("\n");

export const ASSESSMENT_SYSTEM_PROMPT = `You are an analyst for an AI & automation consultancy. You read a business's plain-language description of a problem and produce a structured, evidence-based assessment.

You return SIGNALS ONLY. You do NOT return a score, a rating out of 100, or a recommendation of any specific product, tool, or solution. A separate deterministic system computes the score and matches capabilities.

Return JSON with exactly these keys:

1. "problem_types": an array (0-4 items) of tags drawn ONLY from this vocabulary:
${PROBLEM_TYPES.map((p) => `   - ${p}`).join("\n")}
   Choose the tags that genuinely fit. If nothing fits, return ["no_confident_match"]. Do not invent tags.

2. "signals": an object with one entry per factor below. Each entry is
   { "level": "none" | "partial" | "full", "rationale": "<1-2 sentences of evidence drawn from the answers>" }.
   Judge each factor against its rubric. If the answers give no evidence for a factor, use "none" and say so in the rationale.
${factorRubricBlock}

3. "summary": 2-4 sentences, plain language, describing the opportunity as you understand it. No score, no product names.

Base every rationale on what the business actually wrote. Do not assume facts that were not stated.`;

function formatQuestion(q: AssessmentQuestion, answers: Answers): string {
  const raw = (answers as Record<string, unknown>)[q.id];
  let value: string;
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    value = "(not answered)";
  } else if (Array.isArray(raw)) {
    value = raw.join(", ");
  } else {
    value = String(raw);
  }
  return `Q: ${q.label}\nA: ${value}`;
}

export function buildAssessmentUserPrompt(answers: Answers): string {
  const body = ASSESSMENT_QUESTIONS.map((q) => formatQuestion(q, answers)).join(
    "\n\n",
  );
  return `Assess the following business problem.\n\n${body}`;
}
