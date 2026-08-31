import "server-only";

import Groq from "groq-sdk";

import { env } from "@/env";

import {
  ASSESSMENT_SIGNALS_SCHEMA_NAME,
  buildAssessmentJsonSchema,
} from "./assessment-schema";

/**
 * Groq client wrapper (Phase 3). Provider decision: docs/adr/0001-ai-provider-groq.md.
 *
 * The SDK auto-retries transient failures 2x with backoff and times out at 60s.
 * Each call here issues ONE completion; higher-level retry / repair logic lives
 * in the callers that own the conversation.
 */

let client: Groq | undefined;

function getClient(): Groq {
  client ??= new Groq({ apiKey: env.GROQ_API_KEY });
  return client;
}

export type GroqCompletion = {
  /** Raw JSON string from the model's message content. */
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  /** "stop" | "length" | "content_filter" | … — surfaced for truncation checks. */
  finishReason: string | null;
};

/** @deprecated alias kept for existing imports. */
export type AssessmentCompletion = GroqCompletion;

export type AssessmentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type StructuredCompletionOptions = {
  messages: readonly AssessmentMessage[];
  model: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxCompletionTokens: number;
  reasoningEffort: "low" | "medium" | "high";
  temperature?: number;
};

/**
 * One structured-output (strict json_schema) completion. Throws on transport
 * failure (after the SDK's retries) or an empty message.
 */
async function runStructuredCompletion(
  opts: StructuredCompletionOptions,
): Promise<GroqCompletion> {
  const startedAt = Date.now();

  const body = {
    model: opts.model,
    messages: opts.messages as Groq.Chat.ChatCompletionMessageParam[],
    temperature: opts.temperature ?? 0.4,
    max_completion_tokens: opts.maxCompletionTokens,
    // Groq-specific params — not in the SDK's typed surface yet.
    reasoning_effort: opts.reasoningEffort,
    reasoning_format: "hidden",
    response_format: {
      type: "json_schema",
      json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
    },
  } satisfies Record<string, unknown>;

  const completion = (await getClient().chat.completions.create(
    body as Parameters<Groq["chat"]["completions"]["create"]>[0],
  )) as Groq.Chat.ChatCompletion;

  const choice = completion.choices[0];
  const content = choice?.message.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty completion");
  }

  return {
    content,
    model: completion.model || opts.model,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - startedAt,
    finishReason: choice?.finish_reason ?? null,
  };
}

// `env` skips zod defaults when SKIP_ENV_VALIDATION is set (tests, check:*).
const assessmentModel = () => env.GROQ_MODEL || "openai/gpt-oss-120b";
const narrativeModel = () =>
  env.GROQ_NARRATIVE_MODEL || env.GROQ_MODEL || "openai/gpt-oss-120b";

/** The assessment signals call (Slice A — STEP 1). */
export function createAssessmentCompletion(
  messages: readonly AssessmentMessage[],
): Promise<GroqCompletion> {
  return runStructuredCompletion({
    messages,
    model: assessmentModel(),
    schemaName: ASSESSMENT_SIGNALS_SCHEMA_NAME,
    schema: buildAssessmentJsonSchema(),
    maxCompletionTokens: 2048,
    reasoningEffort: "medium",
  });
}

/**
 * The compact "how we'd solve this" call (2nd call, after matching). Smaller
 * token budget + low reasoning effort to stay comfortably inside the Groq free
 * tier. Callers MUST treat a thrown error as "use the templated fallback".
 */
export function createNarrativeCompletion(
  messages: readonly AssessmentMessage[],
  schema: Record<string, unknown>,
): Promise<GroqCompletion> {
  return runStructuredCompletion({
    messages,
    model: narrativeModel(),
    schemaName: "solution_narrative",
    schema,
    maxCompletionTokens: 900,
    reasoningEffort: "low",
    temperature: 0.5,
  });
}
