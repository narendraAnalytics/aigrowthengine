import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  computeIdeaVerdict,
  parseIdeaSignals,
  recommendedIdeaPath,
} from "@/lib/idea";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import { createIdeaCompletion, type AssessmentMessage } from "../ai/groq";
import { IDEA_SYSTEM_PROMPT, buildIdeaUserPrompt } from "../ai/idea-prompt";
import {
  ideaModelResponseSchema,
  type IdeaModelResponse,
} from "../ai/idea-schema";
import { hashPrompt, logAiRun, type AiRunOutcome } from "../ai/log";
import { sendIdeaResult, sendIdeaTeamAlert } from "../email/idea-emails";

import type { SubmitIdeaRequest } from "@/lib/idea";

/**
 * The AI Idea Assessment pipeline. Runs entirely in `apps/web`:
 *
 *   answers -> 1 Groq call { signals, summary, main_risk, ai_approaches }
 *           -> validate + repair-retry + fail-closed   (Zod is the guarantee)
 *           -> computeIdeaVerdict()                     (deterministic, versioned)
 *           -> recommendedIdeaPath()                    (deterministic)
 *           -> persist idea_assessments + idea_assessment_results
 *           -> auto-send the result email + team alert  (best-effort)
 *
 * The model emits SIGNALS ONLY (CLAUDE.md #1): it never returns a score or a
 * build/no-build verdict.
 */

export class IdeaAssessmentFailedError extends Error {
  constructor(
    public readonly reason: string,
    options?: { cause?: unknown },
  ) {
    super(reason, options);
    this.name = "IdeaAssessmentFailedError";
  }
}

export type RunIdeaAssessmentInput = {
  userId: string;
  answers: SubmitIdeaRequest["answers"];
  contact: SubmitIdeaRequest["contact"];
};

export type RunIdeaAssessmentResult = {
  ideaAssessmentId: string;
  status: "scored";
  potentialScore: number;
  verdict: "build" | "refine" | "validate" | "rethink";
};

const REPAIR_INSTRUCTION =
  "Your previous reply did not match the required JSON schema. Reply again with ONLY valid JSON that matches the schema — no prose, no markdown, no code fences.";

type ParseOutcome =
  { ok: true; value: IdeaModelResponse } | { ok: false; error: unknown };

export function tryParseIdeaSignals(content: string): ParseOutcome {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (error) {
    return { ok: false, error };
  }
  const parsed = ideaModelResponseSchema.safeParse(json);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: parsed.error };
}

async function requestIdeaSignals(
  userId: string,
  ideaAssessmentId: string,
  answers: RunIdeaAssessmentInput["answers"],
): Promise<{ response: IdeaModelResponse; outcome: AiRunOutcome }> {
  const system: AssessmentMessage = {
    role: "system",
    content: IDEA_SYSTEM_PROMPT,
  };
  const user: AssessmentMessage = {
    role: "user",
    content: buildIdeaUserPrompt(answers),
  };
  const promptHash = hashPrompt(`${system.content}\n\n${user.content}`);

  const first = await createIdeaCompletion([system, user]);
  const firstParse = tryParseIdeaSignals(first.content);

  if (firstParse.ok) {
    await logAiRun({
      userId,
      assessmentId: ideaAssessmentId,
      purpose: "idea_signals",
      model: first.model,
      promptHash,
      promptTokens: first.promptTokens,
      completionTokens: first.completionTokens,
      latencyMs: first.latencyMs,
      outcome: "ok",
    });
    return { response: firstParse.value, outcome: "ok" };
  }

  const repair = await createIdeaCompletion([
    system,
    user,
    { role: "assistant", content: first.content },
    { role: "user", content: REPAIR_INSTRUCTION },
  ]);
  const repairParse = tryParseIdeaSignals(repair.content);
  const latencyMs = first.latencyMs + repair.latencyMs;
  const promptTokens = first.promptTokens + repair.promptTokens;
  const completionTokens = first.completionTokens + repair.completionTokens;

  if (repairParse.ok) {
    await logAiRun({
      userId,
      assessmentId: ideaAssessmentId,
      purpose: "idea_signals",
      model: repair.model,
      promptHash,
      promptTokens,
      completionTokens,
      latencyMs,
      outcome: "schema_repair",
    });
    return { response: repairParse.value, outcome: "schema_repair" };
  }

  await logAiRun({
    userId,
    assessmentId: ideaAssessmentId,
    purpose: "idea_signals",
    model: repair.model,
    promptHash,
    promptTokens,
    completionTokens,
    latencyMs,
    outcome: "failed",
  });
  throw new IdeaAssessmentFailedError(
    "model output failed schema validation after one repair attempt",
    { cause: repairParse.error },
  );
}

/**
 * The pure core: validated model response -> persisted shape. No I/O.
 * Exported for unit testing.
 */
export function deriveIdeaOutcome(response: IdeaModelResponse) {
  const signals = parseIdeaSignals(response.signals);
  const verdict = computeIdeaVerdict(signals);
  const recommendedPath = recommendedIdeaPath(verdict);
  return { signals, verdict, recommendedPath };
}

export async function runIdeaAssessment(
  input: RunIdeaAssessmentInput,
): Promise<RunIdeaAssessmentResult> {
  const { userId, answers, contact } = input;

  const [created] = await db
    .insert(schema.ideaAssessments)
    .values({
      userId,
      organizationId: null,
      status: "analyzing",
      answers,
      contactEmail: contact.email,
      contactName: contact.name ?? null,
    })
    .returning({ id: schema.ideaAssessments.id });

  if (!created) {
    throw new IdeaAssessmentFailedError("could not create the idea row");
  }
  const ideaAssessmentId = created.id;

  await recordAuditEvent({
    type: "idea_assessment.submitted",
    actorId: userId,
    actorRole: null,
    tenant: `personal:${userId}`,
    resourceType: "idea_assessment",
    resourceId: ideaAssessmentId,
    requestId: null,
    metadata: {},
  });

  try {
    const { response } = await requestIdeaSignals(
      userId,
      ideaAssessmentId,
      answers,
    );
    const { signals, verdict, recommendedPath } = deriveIdeaOutcome(response);

    const resultId = randomUUID();

    await db.batch([
      db.insert(schema.ideaAssessmentResults).values({
        id: resultId,
        ideaAssessmentId,
        signals,
        potentialScore: verdict.potentialScore,
        scoreBand: verdict.band,
        verdict: verdict.verdict,
        verdictReason: verdict.verdictReason,
        verdictModelVersion: verdict.modelVersion,
        summary: response.summary,
        mainRisk: response.main_risk,
        aiApproaches: response.ai_approaches,
        recommendedPath,
      }),
      db
        .update(schema.ideaAssessments)
        .set({ status: "scored", updatedAt: new Date() })
        .where(eq(schema.ideaAssessments.id, ideaAssessmentId)),
    ] as unknown as Parameters<typeof db.batch>[0]);

    await recordAuditEvent({
      type: "idea_assessment.scored",
      actorId: userId,
      actorRole: null,
      tenant: `personal:${userId}`,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: {
        potentialScore: verdict.potentialScore,
        verdict: verdict.verdict,
      },
    });

    // Auto-send both emails — never let a delivery failure fail the assessment.
    await Promise.allSettled([
      sendIdeaResult(ideaAssessmentId),
      sendIdeaTeamAlert(ideaAssessmentId),
    ]);

    return {
      ideaAssessmentId,
      status: "scored",
      potentialScore: verdict.potentialScore,
      verdict: verdict.verdict,
    };
  } catch (error) {
    await db
      .update(schema.ideaAssessments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(schema.ideaAssessments.id, ideaAssessmentId))
      .catch(() => undefined);

    await recordAuditEvent({
      type: "idea_assessment.failed",
      actorId: userId,
      actorRole: null,
      tenant: `personal:${userId}`,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error instanceof IdeaAssessmentFailedError
      ? error
      : new IdeaAssessmentFailedError("idea-assessment pipeline error", {
          cause: error,
        });
  }
}
