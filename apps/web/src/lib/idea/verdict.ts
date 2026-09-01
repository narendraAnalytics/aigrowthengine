import {
  IDEA_DIMENSIONS,
  IDEA_LEVEL_FRACTION,
  type IdeaDimensionId,
  type IdeaSignalLevel,
} from "./dimensions";

import type { IdeaSignals } from "./signals";

/**
 * Deterministic, versioned idea evaluation. Pure function — no I/O, no
 * randomness, no model calls. Same input always yields the same output.
 *
 *   potentialScore = round( Σ dimensions  IDEA_LEVEL_FRACTION[level] × weight )
 *
 * The 4-way verdict comes from an ORDERED decision table over the score plus a
 * few dimension guardrails (see below). Bump IDEA_VERDICT_VERSION on ANY change
 * to weights, rubric semantics, thresholds or the decision table, and persist it
 * alongside every result so historical verdicts stay explainable.
 */
export const IDEA_VERDICT_VERSION = "idea-verdict-1.0.0";

export const IDEA_VERDICTS = [
  "build",
  "refine",
  "validate",
  "rethink",
] as const;
export type IdeaVerdict = (typeof IDEA_VERDICTS)[number];

export const IDEA_VERDICT_COPY: Record<
  IdeaVerdict,
  { label: string; tagline: string; accent: string }
> = {
  build: {
    label: "BUILD",
    tagline: "Strong signals across the board — start building a focused MVP.",
    accent: "#16a34a",
  },
  refine: {
    label: "REFINE",
    tagline: "Real potential with specific gaps to close before you commit.",
    accent: "#f97316",
  },
  validate: {
    label: "VALIDATE",
    tagline: "Promising, but you need real demand evidence before building.",
    accent: "#2563eb",
  },
  rethink: {
    label: "RETHINK",
    tagline: "Core assumptions look weak — reshape the idea before investing.",
    accent: "#dc2626",
  },
};

export const IDEA_BAND_THRESHOLDS = { strong: 72, promising: 50 } as const;
export type IdeaScoreBand = "strong" | "promising" | "moderate" | "weak";

export function ideaBandForScore(score: number): IdeaScoreBand {
  if (score >= IDEA_BAND_THRESHOLDS.strong) return "strong";
  if (score >= IDEA_BAND_THRESHOLDS.promising) return "promising";
  if (score >= 30) return "moderate";
  return "weak";
}

/** Human label for a single dimension level, used on the result page. */
export const IDEA_LEVEL_LABEL: Record<IdeaSignalLevel, string> = {
  none: "Weak",
  partial: "Promising",
  full: "Strong",
};

export type IdeaDimensionBreakdown = {
  id: IdeaDimensionId;
  label: string;
  weight: number;
  level: IdeaSignalLevel;
  /** Points earned (IDEA_LEVEL_FRACTION[level] × weight). */
  points: number;
  rationale: string;
};

export type IdeaVerdictResult = {
  potentialScore: number;
  band: IdeaScoreBand;
  verdict: IdeaVerdict;
  /** Why this verdict, in one sentence — traceable to the decision table. */
  verdictReason: string;
  modelVersion: string;
  breakdown: IdeaDimensionBreakdown[];
};

/**
 * The ordered decision table. First matching rule wins.
 *
 *   1. RETHINK  — score < 40, OR problem_strength is "none"
 *   2. VALIDATE — demand_evidence is "none" AND score < strong threshold
 *   3. BUILD    — score >= strong threshold AND problem_strength "full"
 *                 AND demand_evidence != "none"
 *   4. REFINE   — everything else (has potential, specific gaps remain)
 */
function decideVerdict(
  score: number,
  levels: Record<IdeaDimensionId, IdeaSignalLevel>,
): { verdict: IdeaVerdict; verdictReason: string } {
  if (score < 40 || levels.problem_strength === "none") {
    return {
      verdict: "rethink",
      verdictReason:
        levels.problem_strength === "none"
          ? "The underlying problem isn't evidenced as real and painful yet."
          : "Too few dimensions are strong enough to justify building.",
    };
  }

  if (
    levels.demand_evidence === "none" &&
    score < IDEA_BAND_THRESHOLDS.strong
  ) {
    return {
      verdict: "validate",
      verdictReason:
        "The idea reads well, but there's no evidence real customers want it — prove demand first.",
    };
  }

  if (
    score >= IDEA_BAND_THRESHOLDS.strong &&
    levels.problem_strength === "full" &&
    levels.demand_evidence !== "none"
  ) {
    return {
      verdict: "build",
      verdictReason:
        "Strong problem, some demand evidence, and a buildable solution — the risk now is over-building.",
    };
  }

  return {
    verdict: "refine",
    verdictReason:
      "The foundations are there; a few specific weak spots need work before committing.",
  };
}

export function computeIdeaVerdict(signals: IdeaSignals): IdeaVerdictResult {
  const breakdown: IdeaDimensionBreakdown[] = IDEA_DIMENSIONS.map((dim) => {
    const signal = signals[dim.id];
    const points = IDEA_LEVEL_FRACTION[signal.level] * dim.weight;
    return {
      id: dim.id,
      label: dim.label,
      weight: dim.weight,
      level: signal.level,
      points,
      rationale: signal.rationale,
    };
  });

  const potentialScore = Math.round(
    breakdown.reduce((sum, d) => sum + d.points, 0),
  );

  const levels = Object.fromEntries(
    breakdown.map((d) => [d.id, d.level]),
  ) as Record<IdeaDimensionId, IdeaSignalLevel>;

  const { verdict, verdictReason } = decideVerdict(potentialScore, levels);

  return {
    potentialScore,
    band: ideaBandForScore(potentialScore),
    verdict,
    verdictReason,
    modelVersion: IDEA_VERDICT_VERSION,
    breakdown,
  };
}

/**
 * A deterministic "recommended path" — up to 5 founder-facing next steps, chosen
 * by the WEAKEST dimensions first so the advice targets what actually needs
 * work. No model call; the prose comes from a fixed catalogue.
 */
const PATH_STEPS: Record<IdeaDimensionId, { none: string; partial: string }> = {
  problem_strength: {
    none: "Run 10–15 problem interviews with the group you think has this pain — confirm it's frequent, costly and unsolved before anything else.",
    partial:
      "Sharpen the problem: pick the single most painful moment for one narrow user and quantify what it costs them today.",
  },
  demand_evidence: {
    none: "Get demand proof before building — a landing page with a real signup or pre-order ask, or 5 letters of intent from named customers.",
    partial:
      "Convert interest into commitment: ask your interested users for a paid pilot, a deposit, or a signed LOI.",
  },
  market_potential: {
    none: "Define a beachhead: one specific, reachable customer segment you can name, count and get in front of in 90 days.",
    partial:
      "Size the beachhead properly — how many businesses/people, how you'll reach the first 100, and where the market expands next.",
  },
  competition_gap: {
    none: "Map the alternatives (tools, spreadsheets, agencies, doing nothing) and find the one job you can do distinctly better — or reshape the idea.",
    partial:
      "Pressure-test your wedge: write the one sentence a customer would use to explain why they picked you over the obvious alternative.",
  },
  ai_feasibility: {
    none: "De-risk the tech: prototype the single hardest AI step on real data and measure accuracy before scoping the full product.",
    partial:
      "Design the human-in-the-loop: decide which AI outputs are auto-applied vs. reviewed, and what accuracy bar the MVP must clear.",
  },
};

const BUILD_TAIL =
  "Build a thin MVP that does one core job end to end, put it in front of 5–10 real users, and measure whether they come back and pay.";

export function recommendedIdeaPath(result: IdeaVerdictResult): string[] {
  const ranked = [...result.breakdown].sort((a, b) => {
    const rank = (l: IdeaSignalLevel) =>
      l === "none" ? 0 : l === "partial" ? 1 : 2;
    return rank(a.level) - rank(b.level) || b.weight - a.weight;
  });

  const steps: string[] = [];
  for (const dim of ranked) {
    if (dim.level === "full") continue;
    steps.push(PATH_STEPS[dim.id][dim.level === "none" ? "none" : "partial"]);
    if (steps.length === 4) break;
  }

  steps.push(BUILD_TAIL);
  return steps;
}
