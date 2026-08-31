export {
  FACTORS,
  FACTOR_IDS,
  SIGNAL_LEVELS,
  LEVEL_FRACTION,
  TOTAL_WEIGHT,
  getFactor,
  type Factor,
  type FactorId,
  type SignalLevel,
} from "./factors";
export {
  factorSignalSchema,
  leadSignalsSchema,
  parseLeadSignals,
  type FactorSignal,
  type LeadSignals,
} from "./signals";
export {
  SCORING_MODEL_VERSION,
  BAND_THRESHOLDS,
  bandForScore,
  computeLeadScore,
  type ScoreBand,
  type FactorBreakdown,
  type LeadScore,
} from "./score";
export {
  MATCH_THRESHOLDS,
  classifyMatch,
  hasConfidentMatch,
  matchClassToSignalLevel,
  type MatchClass,
} from "./match";
