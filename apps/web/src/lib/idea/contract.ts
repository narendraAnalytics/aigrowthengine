import { z } from "zod";

import { IDEA_QUESTIONS } from "./questions";

import type { AssessmentQuestion } from "@/lib/assessment/questions";

/**
 * API + form contract for the AI Idea Assessment.
 *
 *   POST /api/idea-assessments               submit answers, run the pipeline
 *   POST /api/idea-assessments/:id/contact   attach lead contact details
 *
 * The submit schema is DERIVED from IDEA_QUESTIONS so the wizard and the API
 * never drift. Contact (email) is collected on the last wizard step; the richer
 * "talk to our team" details are captured after the result via the contact
 * endpoint.
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
for (const q of IDEA_QUESTIONS) {
  const base = answerSchemaForQuestion(q);
  answersShape[q.id] = q.required ? base : base.optional();
}

/**
 * Contact collected on the wizard's last step. Just an email (the address the
 * result is emailed to) plus an optional name. NEVER sent to the LLM — the
 * pipeline builds the prompt from `answers` alone.
 */
export const ideaContactSchema = z
  .object({
    email: z.string().trim().email().max(320),
    name: z.string().trim().max(200).optional(),
  })
  .strict();
export type IdeaContact = z.infer<typeof ideaContactSchema>;

export const submitIdeaRequestSchema = z.object({
  answers: z.object(answersShape).strict(),
  contact: ideaContactSchema,
});
export type SubmitIdeaRequest = z.infer<typeof submitIdeaRequestSchema>;

/** Richer lead details, captured after the result on the "talk to our team" CTA. */
export const ideaLeadContactSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    company: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .strict();
export type IdeaLeadContact = z.infer<typeof ideaLeadContactSchema>;

export const ideaAssessmentStatusSchema = z.enum([
  "analyzing",
  "scored",
  "failed",
]);
export type IdeaAssessmentStatus = z.infer<typeof ideaAssessmentStatusSchema>;
