import type { SignalLevel } from "./factors";

/**
 * Capability-match confidence classification (Phase 0.3 "match thresholds").
 *
 *   strong   confidence >= 0.80   -> a delivered capability clearly fits
 *   partial  0.50 <= confidence < 0.80
 *   none     confidence < 0.50    -> the "we can't confidently map this" path;
 *                                    render NO_CONFIDENT_MATCH + Request Expert Review
 *
 * The matcher produces the confidence deterministically (it is NOT asked of the
 * model). `matchClassToSignalLevel` feeds the Solution Fit scoring factor so the
 * score reflects real deliverability, not the model's optimism.
 */
export const MATCH_THRESHOLDS = { strong: 0.8, partial: 0.5 } as const;

export type MatchClass = "strong" | "partial" | "none";

export function classifyMatch(confidence: number): MatchClass {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new RangeError(`match confidence must be in [0, 1], got ${confidence}`);
  }
  if (confidence >= MATCH_THRESHOLDS.strong) return "strong";
  if (confidence >= MATCH_THRESHOLDS.partial) return "partial";
  return "none";
}

export function hasConfidentMatch(confidence: number): boolean {
  return classifyMatch(confidence) !== "none";
}

const MATCH_TO_LEVEL: Record<MatchClass, SignalLevel> = {
  strong: "full",
  partial: "partial",
  none: "none",
};

/** Derive the Solution Fit signal level from the best capability match. */
export function matchClassToSignalLevel(cls: MatchClass): SignalLevel {
  return MATCH_TO_LEVEL[cls];
}
