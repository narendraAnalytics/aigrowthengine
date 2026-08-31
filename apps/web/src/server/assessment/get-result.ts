import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getCapability } from "@/lib/capabilities";
import {
  computeLeadScore,
  parseLeadSignals,
  type FactorBreakdown,
  type MatchClass,
  type ScoreBand,
} from "@/lib/scoring";
import { db, schema } from "@/server/db";

import { parseNarrative } from "../ai/solution-narrative";

/**
 * Read an assessment for the result page (Slice A — STEP 5). Ownership-checked:
 * only the personal owner (`user_id` match, no org) can load it. Returns null
 * for a missing id or a row owned by someone else — the page renders a 404.
 *
 * The 7-factor breakdown is recomputed from the persisted `signals` with the
 * same deterministic function used at scoring time, so "Why this score?" always
 * reconciles with the stored total.
 */

export type ResultCapabilityMatch = {
  capabilityId: string;
  name: string;
  oneLiner: string;
  confidence: number;
  matchClass: MatchClass;
  rationale: string | null;
  rank: number;
  /** null for every capability today — the result page must not invent outcomes. */
  deliveryStatus: string | null;
};

export type AssessmentResultView = {
  assessmentId: string;
  status: (typeof schema.assessmentStatus.enumValues)[number];
  createdAt: Date;
  result: {
    leadScore: number;
    scoreBand: ScoreBand;
    scoringModelVersion: string;
    summary: string | null;
    problemTypes: string[];
    industry: string | null;
    noConfidentMatch: boolean;
    narrative: { summary: string; steps: string[] } | null;
    breakdown: FactorBreakdown[];
    matches: ResultCapabilityMatch[];
  } | null;
};

export async function getAssessmentResult(
  assessmentId: string,
  userId: string,
): Promise<AssessmentResultView | null> {
  const row = await db.query.assessments.findFirst({
    where: and(
      eq(schema.assessments.id, assessmentId),
      eq(schema.assessments.userId, userId),
      isNull(schema.assessments.organizationId),
    ),
    with: {
      result: {
        with: {
          matches: true,
        },
      },
    },
  });

  if (!row) return null;

  let result: AssessmentResultView["result"] = null;
  if (row.result) {
    const signals = parseLeadSignals(row.result.signals);
    const { breakdown } = computeLeadScore(signals);

    const matches: ResultCapabilityMatch[] = [...row.result.matches]
      .sort((a, b) => a.rank - b.rank)
      .map((m) => {
        const cap = getCapability(m.capabilityId);
        return {
          capabilityId: m.capabilityId,
          name: cap?.name ?? m.capabilityId,
          oneLiner: cap?.oneLiner ?? "",
          confidence: Number(m.confidence),
          matchClass: m.matchClass,
          rationale: m.rationale,
          rank: m.rank,
          deliveryStatus: cap?.deliveryStatus ?? null,
        };
      });

    result = {
      leadScore: row.result.leadScore,
      scoreBand: row.result.scoreBand,
      scoringModelVersion: row.result.scoringModelVersion,
      summary: row.result.summary,
      problemTypes: row.result.problemTypes as string[],
      industry: row.result.industry,
      noConfidentMatch: row.result.noConfidentMatch,
      narrative: parseNarrative(row.result.solutionNarrative),
      breakdown,
      matches,
    };
  }

  return {
    assessmentId: row.id,
    status: row.status,
    createdAt: row.createdAt,
    result,
  };
}
