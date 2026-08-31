import { CAPABILITIES, PROBLEM_TYPES } from "@/lib/capabilities";
import { classifyMatch, type MatchClass } from "@/lib/scoring/match";

/**
 * Deterministic capability matcher (Phase 3, Slice A — STEP 2).
 *
 * Pure and versioned. NO model call: the LLM only tags a problem with
 * `problem_types`; the confidence that a delivered capability fits is computed
 * here so the Solution Fit scoring factor reflects real deliverability, not the
 * model's optimism (CLAUDE.md #1, #2).
 *
 *   ptScore    = |problem_types ∩ cap.problemTypes| / |problem_types ∪ cap.problemTypes|   (Jaccard)
 *   indScore   = industry ∈ cap.industries ? 1 : 0
 *   confidence = clamp01( 0.65·ptScore + 0.35·indScore )
 *
 * Returns the top 3 capabilities by confidence. `bestConfidence < 0.50` is the
 * "we can't confidently map this" path — render NO_CONFIDENT_MATCH + Request
 * Expert Review; never invent a match.
 *
 * Phase 8 replaces this with pgvector hybrid retrieval behind a flag.
 */
export const MATCHER_VERSION = "1.0.0";

/** Weights for the two signals. Bump MATCHER_VERSION on any change here. */
const PT_WEIGHT = 0.65;
const IND_WEIGHT = 0.35;

/** Below this best-confidence, route to expert review (mirrors MATCH_THRESHOLDS.partial). */
export const NO_CONFIDENT_MATCH_THRESHOLD = 0.5;

const KNOWN_PROBLEM_TYPES = new Set<string>(PROBLEM_TYPES);
const MAX_MATCHES = 3;

export type CapabilityMatch = {
  capabilityId: string;
  name: string;
  /** 0..1, rounded to 3 decimal places (DB column is numeric(4,3)). */
  confidence: number;
  matchClass: MatchClass;
  rationale: string;
  /** 1-based position in the returned list. */
  rank: number;
};

export type MatchResult = {
  /** Top matches, confidence descending. Empty when nothing scored above zero. */
  matches: CapabilityMatch[];
  /** Confidence of the best match, or 0 when there are none. */
  bestConfidence: number;
  /** True when no capability clears NO_CONFIDENT_MATCH_THRESHOLD. */
  noConfidentMatch: boolean;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function jaccard(a: ReadonlySet<string>, b: readonly string[]): number {
  if (a.size === 0 || b.length === 0) return 0;
  let intersection = 0;
  const union = new Set(a);
  for (const item of b) {
    if (a.has(item)) intersection += 1;
    union.add(item);
  }
  return union.size === 0 ? 0 : intersection / union.size;
}

function buildRationale(
  shared: string[],
  industryMatched: boolean,
  industry: string | null,
): string {
  const parts: string[] = [];
  if (shared.length > 0) {
    parts.push(
      `problem type${shared.length > 1 ? "s" : ""} ${shared.join(", ")}`,
    );
  }
  if (industryMatched && industry) {
    parts.push(`industry ${industry}`);
  }
  return parts.length > 0
    ? `Matched on ${parts.join(" and ")}.`
    : "No overlapping problem type or industry.";
}

/**
 * @param problemTypes  values the classifier returned (unknown values and the
 *                       `no_confident_match` sentinel are dropped)
 * @param industry       the industry from the intake form, or null
 */
export function matchCapabilities(
  problemTypes: readonly string[],
  industry: string | null,
): MatchResult {
  const cleaned = [
    ...new Set(
      problemTypes.filter(
        (pt) => KNOWN_PROBLEM_TYPES.has(pt) && pt !== "no_confident_match",
      ),
    ),
  ];

  if (cleaned.length === 0) {
    return { matches: [], bestConfidence: 0, noConfidentMatch: true };
  }

  const problemSet = new Set(cleaned);

  const scored = CAPABILITIES.map((cap) => {
    const ptScore = jaccard(problemSet, cap.problemTypes);
    const industryMatched =
      industry != null &&
      (cap.industries as readonly string[]).includes(industry);
    const indScore = industryMatched ? 1 : 0;
    const confidence = round3(
      clamp01(PT_WEIGHT * ptScore + IND_WEIGHT * indScore),
    );
    const shared = cap.problemTypes.filter((pt) => problemSet.has(pt));
    return {
      cap,
      confidence,
      rationale: buildRationale(shared, industryMatched, industry),
    };
  })
    .filter((s) => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const matches: CapabilityMatch[] = scored
    .slice(0, MAX_MATCHES)
    .map((s, i) => ({
      capabilityId: s.cap.id,
      name: s.cap.name,
      confidence: s.confidence,
      matchClass: classifyMatch(s.confidence),
      rationale: s.rationale,
      rank: i + 1,
    }));

  const bestConfidence = matches[0]?.confidence ?? 0;

  return {
    matches,
    bestConfidence,
    noConfidentMatch: bestConfidence < NO_CONFIDENT_MATCH_THRESHOLD,
  };
}
