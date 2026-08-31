import {
  FACTORS,
  LEVEL_FRACTION,
  type FactorId,
  type SignalLevel,
} from "./factors";

import type { LeadSignals } from "./signals";

/**
 * Deterministic, versioned lead scoring. Pure function — no I/O, no randomness,
 * no model calls. Same input always yields the same output.
 *
 * score = round( Σ factors  LEVEL_FRACTION[level] × weight )
 *
 * Bump SCORING_MODEL_VERSION on ANY change to weights, rubric semantics or band
 * thresholds, and persist it alongside every score so historical scores stay
 * explainable.
 */
export const SCORING_MODEL_VERSION = "1.0.0";

export const BAND_THRESHOLDS = { high: 75, medium: 50 } as const;
export type ScoreBand = "high" | "medium" | "low";

export function bandForScore(score: number): ScoreBand {
  if (score >= BAND_THRESHOLDS.high) return "high";
  if (score >= BAND_THRESHOLDS.medium) return "medium";
  return "low";
}

export type FactorBreakdown = {
  id: FactorId;
  label: string;
  weight: number;
  level: SignalLevel;
  /** Points earned for this factor (LEVEL_FRACTION[level] × weight). */
  points: number;
  /** The model's evidence for this level. */
  rationale: string;
};

export type LeadScore = {
  score: number;
  band: ScoreBand;
  modelVersion: string;
  breakdown: FactorBreakdown[];
};

export function computeLeadScore(signals: LeadSignals): LeadScore {
  const breakdown: FactorBreakdown[] = FACTORS.map((factor) => {
    const signal = signals[factor.id];
    const points = LEVEL_FRACTION[signal.level] * factor.weight;
    return {
      id: factor.id,
      label: factor.label,
      weight: factor.weight,
      level: signal.level,
      points,
      rationale: signal.rationale,
    };
  });

  const raw = breakdown.reduce((sum, f) => sum + f.points, 0);
  const score = Math.round(raw);

  return {
    score,
    band: bandForScore(score),
    modelVersion: SCORING_MODEL_VERSION,
    breakdown,
  };
}
