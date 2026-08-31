import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { matchCapabilities } from "@/lib/matching";
import {
  classifyMatch,
  computeLeadScore,
  matchClassToSignalLevel,
  parseLeadSignals,
} from "@/lib/scoring";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import {
  assessmentModelResponseSchema,
  type AssessmentModelResponse,
} from "../ai/assessment-schema";
import { createAssessmentCompletion, type AssessmentMessage } from "../ai/groq";
import { hashPrompt, logAiRun, type AiRunOutcome } from "../ai/log";
import {
  ASSESSMENT_SYSTEM_PROMPT,
  buildAssessmentUserPrompt,
} from "../ai/prompt";
import {
  generateSolutionNarrative,
  serializeNarrative,
} from "../ai/solution-narrative";
import {
  draftClientResultEmail,
  sendTeamAlert,
} from "../email/assessment-emails";

import type { SubmitAssessmentRequest } from "@/lib/api/contract/assessment";

/**
 * The assessment pipeline (Slice A — STEP 3). Runs entirely in `apps/web`:
 *
 *   answers -> 1 Groq call { problem_types, signals, summary }
 *           -> validate + repair-retry + fail-closed  (Zod is the guarantee)
 *           -> deterministic capability match          (no model call)
 *           -> override solution_fit from the match
 *           -> computeLeadScore()                      (deterministic, versioned)
 *           -> persist assessments + assessment_results + capability_matches
 *
 * The model emits SIGNALS ONLY (CLAUDE.md #1): it never returns a score, and any
 * capability it might name is ignored — matching is done here against the
 * Capability Library (CLAUDE.md #2).
 */

export class AssessmentFailedError extends Error {
  constructor(
    public readonly reason: string,
    options?: { cause?: unknown },
  ) {
    super(reason, options);
    this.name = "AssessmentFailedError";
  }
}

export type RunAssessmentInput = {
  userId: string;
  answers: SubmitAssessmentRequest["answers"];
  contact: SubmitAssessmentRequest["contact"];
};

export type RunAssessmentResult = {
  assessmentId: string;
  status: "scored";
  leadScore: number;
  band: "high" | "medium" | "low";
  noConfidentMatch: boolean;
};

const REPAIR_INSTRUCTION =
  "Your previous reply did not match the required JSON schema. Reply again with ONLY valid JSON that matches the schema — no prose, no markdown, no code fences.";

type ParseOutcome =
  { ok: true; value: AssessmentModelResponse } | { ok: false; error: unknown };

export function tryParseSignals(content: string): ParseOutcome {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (error) {
    return { ok: false, error };
  }
  const parsed = assessmentModelResponseSchema.safeParse(json);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: parsed.error };
}

async function requestSignals(
  userId: string,
  assessmentId: string,
  answers: RunAssessmentInput["answers"],
): Promise<{ response: AssessmentModelResponse; outcome: AiRunOutcome }> {
  const system: AssessmentMessage = {
    role: "system",
    content: ASSESSMENT_SYSTEM_PROMPT,
  };
  const user: AssessmentMessage = {
    role: "user",
    content: buildAssessmentUserPrompt(answers),
  };
  const promptHash = hashPrompt(`${system.content}\n\n${user.content}`);

  const first = await createAssessmentCompletion([system, user]);
  const firstParse = tryParseSignals(first.content);

  if (firstParse.ok) {
    await logAiRun({
      userId,
      assessmentId,
      purpose: "assessment_signals",
      model: first.model,
      promptHash,
      promptTokens: first.promptTokens,
      completionTokens: first.completionTokens,
      latencyMs: first.latencyMs,
      outcome: "ok",
    });
    return { response: firstParse.value, outcome: "ok" };
  }

  const repair = await createAssessmentCompletion([
    system,
    user,
    { role: "assistant", content: first.content },
    { role: "user", content: REPAIR_INSTRUCTION },
  ]);
  const repairParse = tryParseSignals(repair.content);
  const latencyMs = first.latencyMs + repair.latencyMs;
  const promptTokens = first.promptTokens + repair.promptTokens;
  const completionTokens = first.completionTokens + repair.completionTokens;

  if (repairParse.ok) {
    await logAiRun({
      userId,
      assessmentId,
      purpose: "assessment_signals",
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
    assessmentId,
    purpose: "assessment_signals",
    model: repair.model,
    promptHash,
    promptTokens,
    completionTokens,
    latencyMs,
    outcome: "failed",
  });
  throw new AssessmentFailedError(
    "model output failed schema validation after one repair attempt",
    { cause: repairParse.error },
  );
}

/**
 * The pure core: turn a validated model response + industry into the persisted
 * shape. No I/O — the LLM has already spoken; matching and scoring are
 * deterministic. Exported for unit testing.
 */
export function deriveAssessmentOutcome(
  response: AssessmentModelResponse,
  industry: string | null,
) {
  // Drop the sentinel; every other value is already a valid ProblemType (Zod enum).
  const problemTypes = [
    ...new Set(
      response.problem_types.filter((pt) => pt !== "no_confident_match"),
    ),
  ];

  const match = matchCapabilities(problemTypes, industry);
  const bestClass = classifyMatch(match.bestConfidence);
  const best = match.matches[0];

  const signals = parseLeadSignals({
    ...response.signals,
    solution_fit: {
      level: matchClassToSignalLevel(bestClass),
      rationale: best
        ? `Capability match: ${best.name} at ${Math.round(
            best.confidence * 100,
          )}% confidence.`
        : "No capability cleared the confident-match threshold (< 50%).",
    },
  });

  const score = computeLeadScore(signals);

  return { problemTypes, match, signals, score };
}

export async function runAssessment(
  input: RunAssessmentInput,
): Promise<RunAssessmentResult> {
  const { userId, answers, contact } = input;
  const industry = (answers as Record<string, string>).industry ?? null;
  const problemDescription =
    (answers as Record<string, string>).problem_description ?? "";

  const [created] = await db
    .insert(schema.assessments)
    .values({
      userId,
      organizationId: null,
      status: "analyzing",
      answers,
      contactEmail: contact.workEmail,
      contactCompany: contact.companyName,
      contactNote: contact.note ?? null,
    })
    .returning({ id: schema.assessments.id });

  if (!created) {
    throw new AssessmentFailedError("could not create the assessment row");
  }
  const assessmentId = created.id;

  await recordAuditEvent({
    type: "assessment.submitted",
    actorId: userId,
    actorRole: null,
    tenant: `personal:${userId}`,
    resourceType: "assessment",
    resourceId: assessmentId,
    requestId: null,
    metadata: { industry },
  });

  try {
    const { response } = await requestSignals(userId, assessmentId, answers);
    const { problemTypes, match, signals, score } = deriveAssessmentOutcome(
      response,
      industry,
    );

    // 2nd Groq call — "how we'd solve this", grounded in the matched
    // capabilities. Best-effort: falls back to templated text on any failure.
    const narrative = await generateSolutionNarrative(
      { problemDescription, industry, matches: match.matches },
      { userId, assessmentId },
    );

    const resultId = randomUUID();

    const statements = [
      db.insert(schema.assessmentResults).values({
        id: resultId,
        assessmentId,
        problemTypes,
        industry,
        signals,
        leadScore: score.score,
        scoreBand: score.band,
        scoringModelVersion: score.modelVersion,
        summary: response.summary,
        noConfidentMatch: match.noConfidentMatch,
        solutionNarrative: serializeNarrative(narrative),
        solutionNarrativeSource: narrative.source,
      }),
      ...(match.matches.length > 0
        ? [
            db.insert(schema.capabilityMatches).values(
              match.matches.map((m) => ({
                assessmentResultId: resultId,
                capabilityId: m.capabilityId,
                confidence: m.confidence.toFixed(3),
                matchClass: m.matchClass,
                rationale: m.rationale,
                rank: m.rank,
              })),
            ),
          ]
        : []),
      db
        .update(schema.assessments)
        .set({ status: "scored", updatedAt: new Date() })
        .where(eq(schema.assessments.id, assessmentId)),
    ] as const;

    await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);

    await recordAuditEvent({
      type: "assessment.scored",
      actorId: userId,
      actorRole: null,
      tenant: `personal:${userId}`,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: {
        leadScore: score.score,
        band: score.band,
        noConfidentMatch: match.noConfidentMatch,
        problemTypes,
      },
    });

    // Fire the emails — team alert (auto) + client draft (approval-gated).
    // Never let an email failure fail the assessment (CLAUDE.md side-effect).
    await Promise.allSettled([
      sendTeamAlert(assessmentId),
      draftClientResultEmail(assessmentId),
    ]);

    return {
      assessmentId,
      status: "scored",
      leadScore: score.score,
      band: score.band,
      noConfidentMatch: match.noConfidentMatch,
    };
  } catch (error) {
    await db
      .update(schema.assessments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(schema.assessments.id, assessmentId))
      .catch(() => undefined);

    await recordAuditEvent({
      type: "assessment.failed",
      actorId: userId,
      actorRole: null,
      tenant: `personal:${userId}`,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error instanceof AssessmentFailedError
      ? error
      : new AssessmentFailedError("assessment pipeline error", {
          cause: error,
        });
  }
}
