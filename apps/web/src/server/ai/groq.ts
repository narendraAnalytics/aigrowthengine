import "server-only";

import Groq from "groq-sdk";

import { env } from "@/env";

import {
  ASSESSMENT_SIGNALS_SCHEMA_NAME,
  buildAssessmentJsonSchema,
} from "./assessment-schema";

/**
 * Groq client wrapper for the assessment pipeline (Slice A — STEP 1).
 * Provider decision: docs/adr/0001-ai-provider-groq.md.
 *
 * The SDK auto-retries transient failures 2x with backoff and times out at 60s
 * (both configurable). We issue ONE completion per call here; the repair retry
 * on a schema miss is orchestrated by run-assessment.ts, which owns the
 * conversation.
 */

let client: Groq | undefined;

function getClient(): Groq {
  client ??= new Groq({ apiKey: env.GROQ_API_KEY });
  return client;
}

export type AssessmentCompletion = {
  /** Raw JSON string from the model's message content. */
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  /** "stop" | "length" | "content_filter" | … — surfaced for truncation checks. */
  finishReason: string | null;
};

export type AssessmentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * One structured-output completion. Throws on transport failure (after the SDK's
 * own retries) or an empty message — callers treat that as a failed assessment,
 * never a zero score.
 */
export async function createAssessmentCompletion(
  messages: readonly AssessmentMessage[],
): Promise<AssessmentCompletion> {
  // `env` skips zod defaults when SKIP_ENV_VALIDATION is set (tests, check:*),
  // so fall back explicitly.
  const model = env.GROQ_MODEL || "openai/gpt-oss-120b";
  const startedAt = Date.now();

  const body = {
    model,
    messages: messages as Groq.Chat.ChatCompletionMessageParam[],
    temperature: 0.4,
    max_completion_tokens: 2048,
    // Groq-specific params — not in the SDK's typed surface yet.
    reasoning_effort: "medium",
    reasoning_format: "hidden",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: ASSESSMENT_SIGNALS_SCHEMA_NAME,
        strict: true,
        schema: buildAssessmentJsonSchema(),
      },
    },
  } satisfies Record<string, unknown>;

  const completion = (await getClient().chat.completions.create(
    body as Parameters<Groq["chat"]["completions"]["create"]>[0],
  )) as Groq.Chat.ChatCompletion;

  const choice = completion.choices[0];
  const content = choice?.message.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty assessment completion");
  }

  return {
    content,
    model: completion.model || model,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - startedAt,
    finishReason: choice?.finish_reason ?? null,
  };
}
