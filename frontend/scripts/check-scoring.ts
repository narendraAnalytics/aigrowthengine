/**
 * Standalone validation for the lead scoring spec. No test framework yet
 * (roadmap 1.2) — run with `npm run check:scoring`. Exits non-zero on failure.
 */
import {
  FACTORS,
  SIGNAL_LEVELS,
  TOTAL_WEIGHT,
  bandForScore,
  classifyMatch,
  computeLeadScore,
  matchClassToSignalLevel,
  parseLeadSignals,
  SCORING_MODEL_VERSION,
  type LeadSignals,
  type SignalLevel,
} from "../src/lib/scoring";

const errors: string[] = [];
const fail = (m: string) => errors.push(m);

// --- weights + rubric completeness ---
if (TOTAL_WEIGHT !== 100) fail(`Factor weights sum to ${TOTAL_WEIGHT}, expected 100`);

const ids = new Set<string>();
for (const f of FACTORS) {
  if (ids.has(f.id)) fail(`Duplicate factor id: ${f.id}`);
  ids.add(f.id);
  if (f.weight <= 0) fail(`Factor ${f.id} has non-positive weight`);
  for (const level of SIGNAL_LEVELS) {
    if (!f.rubric[level] || f.rubric[level].length < 10) {
      fail(`Factor ${f.id} has no meaningful rubric for level "${level}"`);
    }
  }
}
if (FACTORS.length !== 7) fail(`Expected 7 factors, found ${FACTORS.length}`);

// --- helper to build signals at a uniform level ---
const signalsAt = (level: SignalLevel): LeadSignals =>
  parseLeadSignals(
    Object.fromEntries(
      FACTORS.map((f) => [f.id, { level, rationale: `test:${level}` }]),
    ),
  );

// --- golden cases ---
const allFull = computeLeadScore(signalsAt("full"));
if (allFull.score !== 100) fail(`all-full score = ${allFull.score}, expected 100`);
if (allFull.band !== "high") fail(`all-full band = ${allFull.band}, expected high`);
if (allFull.modelVersion !== SCORING_MODEL_VERSION) fail("modelVersion not propagated");

const allNone = computeLeadScore(signalsAt("none"));
if (allNone.score !== 0) fail(`all-none score = ${allNone.score}, expected 0`);
if (allNone.band !== "low") fail(`all-none band = ${allNone.band}, expected low`);

const allPartial = computeLeadScore(signalsAt("partial"));
if (allPartial.score !== 50) fail(`all-partial score = ${allPartial.score}, expected 50`);
if (allPartial.band !== "medium") fail(`all-partial band = ${allPartial.band}, expected medium`);

// mixed case: full on the big factors, partial elsewhere
const mixed = parseLeadSignals({
  business_impact: { level: "full", rationale: "x" }, // 25
  automation_potential: { level: "full", rationale: "x" }, // 20
  urgency: { level: "partial", rationale: "x" }, // 7.5
  solution_fit: { level: "full", rationale: "x" }, // 15
  budget_signal: { level: "partial", rationale: "x" }, // 5
  decision_maker: { level: "partial", rationale: "x" }, // 5
  technical_feasibility: { level: "full", rationale: "x" }, // 5
});
// 25 + 20 + 7.5 + 15 + 5 + 5 + 5 = 82.5 -> round 83
const mixedScore = computeLeadScore(mixed);
if (mixedScore.score !== 83) fail(`mixed score = ${mixedScore.score}, expected 83`);
if (mixedScore.band !== "high") fail(`mixed band = ${mixedScore.band}, expected high`);

// breakdown must sum to the pre-round total and cover every factor
const breakdownSum = mixedScore.breakdown.reduce((s, b) => s + b.points, 0);
if (Math.abs(breakdownSum - 82.5) > 1e-9) fail(`breakdown sum = ${breakdownSum}, expected 82.5`);
if (mixedScore.breakdown.length !== 7) fail("breakdown missing factors");

// --- bands ---
if (bandForScore(75) !== "high") fail("75 should be high");
if (bandForScore(74) !== "medium") fail("74 should be medium");
if (bandForScore(50) !== "medium") fail("50 should be medium");
if (bandForScore(49) !== "low") fail("49 should be low");

// --- match classification ---
if (classifyMatch(0.8) !== "strong") fail("0.80 should be strong match");
if (classifyMatch(0.79) !== "partial") fail("0.79 should be partial match");
if (classifyMatch(0.5) !== "partial") fail("0.50 should be partial match");
if (classifyMatch(0.49) !== "none") fail("0.49 should be no match");
if (matchClassToSignalLevel(classifyMatch(0.3)) !== "none") fail("no match -> none level");
if (matchClassToSignalLevel(classifyMatch(0.9)) !== "full") fail("strong match -> full level");
try {
  classifyMatch(1.5);
  fail("classifyMatch(1.5) should throw");
} catch {
  /* expected */
}

// --- signal parsing rejects bad input ---
try {
  parseLeadSignals({ business_impact: { level: "amazing", rationale: "x" } });
  fail("parseLeadSignals should reject unknown level / missing factors");
} catch {
  /* expected */
}

if (errors.length > 0) {
  console.error("Scoring checks FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK — 7 factors (weights sum ${TOTAL_WEIGHT}), model ${SCORING_MODEL_VERSION}; ` +
    `golden cases 0/50/83/100 and band + match thresholds verified.`,
);
