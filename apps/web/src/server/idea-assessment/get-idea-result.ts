import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import {
  computeIdeaVerdict,
  parseIdeaSignals,
  type IdeaDimensionBreakdown,
  type IdeaScoreBand,
  type IdeaVerdict,
} from "@/lib/idea";
import { db, schema } from "@/server/db";

/**
 * Read an idea assessment for the result page. Ownership-checked: only the
 * personal owner (`user_id` match, no org) can load it. Returns null for a
 * missing id or a row owned by someone else — the page renders a 404.
 *
 * The dimension breakdown is recomputed from the persisted `signals` with the
 * same deterministic function used at scoring time, so "Why this score?" always
 * reconciles with the stored total.
 */

export type IdeaResultView = {
  ideaAssessmentId: string;
  status: (typeof schema.ideaAssessmentStatus.enumValues)[number];
  createdAt: Date;
  ideaOneliner: string;
  hasLeadContact: boolean;
  result: {
    potentialScore: number;
    band: IdeaScoreBand;
    verdict: IdeaVerdict;
    verdictReason: string;
    verdictModelVersion: string;
    summary: string | null;
    mainRisk: string | null;
    aiApproaches: string[];
    recommendedPath: string[];
    breakdown: IdeaDimensionBreakdown[];
  } | null;
};

export async function getIdeaResult(
  ideaAssessmentId: string,
  userId: string,
): Promise<IdeaResultView | null> {
  const row = await db.query.ideaAssessments.findFirst({
    where: and(
      eq(schema.ideaAssessments.id, ideaAssessmentId),
      eq(schema.ideaAssessments.userId, userId),
      isNull(schema.ideaAssessments.organizationId),
    ),
    with: { result: true },
  });

  if (!row) return null;

  const answers = (row.answers ?? {}) as Record<string, unknown>;
  const ideaOneliner =
    typeof answers.idea_oneliner === "string"
      ? answers.idea_oneliner
      : "Your idea";

  let result: IdeaResultView["result"] = null;
  if (row.result) {
    const signals = parseIdeaSignals(row.result.signals);
    const { breakdown } = computeIdeaVerdict(signals);

    result = {
      potentialScore: row.result.potentialScore,
      band: row.result.scoreBand,
      verdict: row.result.verdict,
      verdictReason: row.result.verdictReason,
      verdictModelVersion: row.result.verdictModelVersion,
      summary: row.result.summary,
      mainRisk: row.result.mainRisk,
      aiApproaches: (row.result.aiApproaches as string[]) ?? [],
      recommendedPath: (row.result.recommendedPath as string[]) ?? [],
      breakdown,
    };
  }

  return {
    ideaAssessmentId: row.id,
    status: row.status,
    createdAt: row.createdAt,
    ideaOneliner,
    hasLeadContact: row.leadName != null,
    result,
  };
}
