import {
  IDEA_DIMENSIONS,
  IDEA_QUESTIONS,
  IDEA_SIGNAL_LEVELS,
} from "@/lib/idea";

import type { AssessmentQuestion } from "@/lib/assessment/questions";
import type { SubmitIdeaRequest } from "@/lib/idea";

/**
 * Prompt construction for the idea-assessment Groq call.
 *
 * The model is asked for SIGNALS ONLY: a { level, rationale } per dimension
 * against the written rubric, a short summary, the biggest risk, and a few
 * illustrative AI building blocks. It is explicitly told NOT to produce a score
 * and NOT to give a build/no-build verdict — that is deterministic (verdict.ts).
 *
 * The intake collects no contact PII; the prompt is built from `answers` alone.
 */

type Answers = SubmitIdeaRequest["answers"];

const dimensionRubricBlock = IDEA_DIMENSIONS.map((d) => {
  const levels = IDEA_SIGNAL_LEVELS.map(
    (lvl) => `      ${lvl}: ${d.rubric[lvl]}`,
  ).join("\n");
  return `  - ${d.id} (${d.label}): ${d.description}\n${levels}`;
}).join("\n");

export const IDEA_SYSTEM_PROMPT = `You are an analyst at an AI venture studio. You read a founder's plain-language description of a new product idea and produce a structured, evidence-based assessment of whether it is worth pursuing.

You return SIGNALS ONLY. You do NOT return a score, a rating out of 100, or a build / don't-build verdict. A separate deterministic system computes the potential score and the recommendation.

Return JSON with exactly these keys:

1. "signals": an object with one entry per dimension below. Each entry is
   { "level": "none" | "partial" | "full", "rationale": "<1-2 sentences of evidence drawn from the founder's answers>" }.
   Judge each dimension against its rubric. If the answers give no evidence for a dimension, use "none" and say so in the rationale. Do not assume facts that were not stated.
${dimensionRubricBlock}

2. "summary": 2-4 sentences, plain language, describing the idea and its potential as you understand it. No score, no verdict.

3. "main_risk": 1-2 sentences naming the single biggest risk to this idea succeeding.

4. "ai_approaches": an array of 0-6 short strings naming generic AI/automation building blocks the solution could plausibly use (e.g. "intent classification", "retrieval over a knowledge base", "structured extraction from documents"). These are illustrative possibilities, not commitments. If AI is a poor fit, return an empty array.

Base every rationale on what the founder actually wrote.`;

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

export function buildIdeaUserPrompt(answers: Answers): string {
  const body = IDEA_QUESTIONS.map((q) => formatQuestion(q, answers)).join(
    "\n\n",
  );
  return `Assess the following product idea.\n\n${body}`;
}
