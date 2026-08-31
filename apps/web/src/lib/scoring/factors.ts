/**
 * Lead Scoring Specification — the 7 factors, weights and rubrics (Phase 0.3).
 *
 * Architecture rule (CLAUDE.md #1): Gemini emits SIGNALS ONLY. The score is
 * computed here by a deterministic, versioned, pure function (see ./score.ts).
 * Any prompt that asks the model for a final number is a defect. "Why 91?" is
 * answerable because the score is just: sum over factors of (levelFraction × weight).
 *
 * Weights are frozen from FinalRoadMap.txt §"Gap 1 — Explainable Lead Scoring":
 *   Business Impact 25 · Automation Potential 20 · Urgency 15 · Solution Fit 15
 *   · Budget Signal 10 · Decision Maker 10 · Technical Feasibility 5  = 100
 */

export const SIGNAL_LEVELS = ["none", "partial", "full"] as const;
export type SignalLevel = (typeof SIGNAL_LEVELS)[number];

/** Fraction of a factor's weight earned at each level. */
export const LEVEL_FRACTION: Record<SignalLevel, number> = {
  none: 0,
  partial: 0.5,
  full: 1,
};

export const FACTOR_IDS = [
  "business_impact",
  "automation_potential",
  "urgency",
  "solution_fit",
  "budget_signal",
  "decision_maker",
  "technical_feasibility",
] as const;
export type FactorId = (typeof FACTOR_IDS)[number];

export type Factor = {
  id: FactorId;
  label: string;
  weight: number;
  description: string;
  /** What earns each level — the written rubric. */
  rubric: Record<SignalLevel, string>;
};

export const FACTORS: readonly Factor[] = [
  {
    id: "business_impact",
    label: "Business Impact",
    weight: 25,
    description:
      "How much value is at stake — cost, revenue, risk or time tied to the problem.",
    rubric: {
      none: "Nice-to-have. No quantified cost/revenue/risk, or clearly trivial (< a few lakh/yr or a few hours/week).",
      partial:
        "A real but bounded pain — a specific team or process affected, rough numbers given, meaningful but not existential.",
      full: "Large, quantified impact on a core process — significant cost, revenue, compliance or risk exposure named with figures.",
    },
  },
  {
    id: "automation_potential",
    label: "Automation Potential",
    weight: 20,
    description:
      "How suited the work is to AI/automation — volume, repetition, rule-clarity, digital inputs.",
    rubric: {
      none: "Highly judgement-based, low volume, or inputs are not digital/structured. Little to automate.",
      partial:
        "Partly repetitive with some structure; automation can assist a human but not run unattended.",
      full: "High-volume, repetitive, rule-describable work on digital inputs — a strong fit for automation with human review.",
    },
  },
  {
    id: "urgency",
    label: "Urgency",
    weight: 15,
    description: "How soon the business wants or needs to act.",
    rubric: {
      none: "No timeline. Exploring only, or 'someday'.",
      partial: "Wants progress this year; a trigger exists but no hard deadline.",
      full: "Active this quarter — a deadline, an event, a mandate, or a problem actively costing money now.",
    },
  },
  {
    id: "solution_fit",
    label: "Solution Fit",
    weight: 15,
    description:
      "How well the problem maps to a capability we can actually deliver. Set from the deterministic capability-match result, NOT the model's opinion.",
    rubric: {
      none: "Below the confident-match threshold (< 50%). Route to Request Expert Review; do not invent a match.",
      partial: "Partial match (50–79%) to one or more capabilities — adaptation or scoping needed.",
      full: "Strong match (>= 80%) to a delivered capability, ideally with a related case study.",
    },
  },
  {
    id: "budget_signal",
    label: "Budget Signal",
    weight: 10,
    description: "Evidence that money exists or can be found for this.",
    rubric: {
      none: "No budget identified; 'just exploring'.",
      partial: "Budgeted for this year, or a clear intent to fund if value is shown.",
      full: "Budget allocated for this quarter, or an explicit spend range stated.",
    },
  },
  {
    id: "decision_maker",
    label: "Decision Maker",
    weight: 10,
    description: "Whether the person engaging can authorise or strongly influence a purchase.",
    rubric: {
      none: "Individual contributor researching; no stated authority or sponsor.",
      partial: "Influencer or team lead — can champion internally, needs sign-off from others.",
      full: "Budget owner / executive sponsor, or explicitly engaging on behalf of one.",
    },
  },
  {
    id: "technical_feasibility",
    label: "Technical Feasibility",
    weight: 5,
    description:
      "How hard delivery looks — data access, integrations, security constraints, IT bandwidth.",
    rubric: {
      none: "Serious blockers: no data access, hostile integrations, heavy compliance with no support, or no IT bandwidth.",
      partial: "Some friction — a few integrations, a security review, moderate data readiness.",
      full: "Clear path — data available, standard integrations, cooperative IT, no unusual constraints.",
    },
  },
] as const;

/** Sum of all factor weights. Asserted to equal 100 by check:scoring. */
export const TOTAL_WEIGHT = FACTORS.reduce((sum, f) => sum + f.weight, 0);

export function getFactor(id: FactorId): Factor {
  const f = FACTORS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown scoring factor: ${id}`);
  return f;
}
