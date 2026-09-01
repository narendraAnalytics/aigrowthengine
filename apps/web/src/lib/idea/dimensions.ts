/**
 * AI Idea Assessment — the 5 evaluation dimensions, weights and rubrics.
 *
 * Same architecture rule as lead scoring (CLAUDE.md #1): the LLM emits SIGNALS
 * ONLY — a { level, rationale } per dimension against the written rubric. The
 * potential score and the BUILD/REFINE/VALIDATE/RETHINK verdict are computed by
 * a deterministic, versioned pure function (see ./verdict.ts). "Why 78?" is
 * answerable because the score is just: sum over dimensions of
 * (levelFraction × weight).
 *
 * Weights sum to 100:
 *   Problem Strength 25 · Demand Evidence 20 · Market Potential 20
 *   · Competition Gap 20 · AI Feasibility 15
 */

export const IDEA_SIGNAL_LEVELS = ["none", "partial", "full"] as const;
export type IdeaSignalLevel = (typeof IDEA_SIGNAL_LEVELS)[number];

/** Fraction of a dimension's weight earned at each level. */
export const IDEA_LEVEL_FRACTION: Record<IdeaSignalLevel, number> = {
  none: 0,
  partial: 0.5,
  full: 1,
};

export const IDEA_DIMENSION_IDS = [
  "problem_strength",
  "demand_evidence",
  "market_potential",
  "competition_gap",
  "ai_feasibility",
] as const;
export type IdeaDimensionId = (typeof IDEA_DIMENSION_IDS)[number];

export type IdeaDimension = {
  id: IdeaDimensionId;
  label: string;
  weight: number;
  description: string;
  /** What earns each level — the written rubric handed to the model. */
  rubric: Record<IdeaSignalLevel, string>;
};

export const IDEA_DIMENSIONS: readonly IdeaDimension[] = [
  {
    id: "problem_strength",
    label: "Problem Strength",
    weight: 25,
    description:
      "How real, frequent and painful the underlying problem is for a specific group.",
    rubric: {
      none: "Vague or speculative problem, or a nice-to-have. No clear sufferer, low frequency, or people are not actively looking for a fix.",
      partial:
        "A real problem for an identifiable group, but either infrequent, mild, or already tolerated with a workaround people are content with.",
      full: "A frequent, painful problem for a clearly named group who actively seek and pay for relief today.",
    },
  },
  {
    id: "demand_evidence",
    label: "Demand Evidence",
    weight: 20,
    description:
      "Concrete proof that customers want this — conversations, waitlist, pilots, or paying users.",
    rubric: {
      none: "No evidence yet. Founder conviction only, or 'people I've mentioned it to liked it'.",
      partial:
        "Has spoken with several potential customers, or has interested users / a waitlist, but no one paying.",
      full: "Paying customers, signed letters of intent, or a pilot with committed spend.",
    },
  },
  {
    id: "market_potential",
    label: "Market Potential",
    weight: 20,
    description:
      "Whether the reachable market is big enough and definable enough to build a business on.",
    rubric: {
      none: "Market is tiny, undefinable, shrinking, or the target customer is 'everyone'.",
      partial:
        "A plausible market with a reachable first segment, but sizing is rough and the beachhead is not yet sharp.",
      full: "A clearly defined, reachable first segment inside a large or fast-growing market, with an obvious path to expand.",
    },
  },
  {
    id: "competition_gap",
    label: "Competition Gap",
    weight: 20,
    description:
      "How much room exists versus incumbents and existing workarounds, and how defensible the wedge is.",
    rubric: {
      none: "Crowded space with strong incumbents and no clear differentiation, or the current workaround is good enough.",
      partial:
        "Alternatives exist but have real gaps; the idea has a plausible angle that needs sharpening.",
      full: "A clear, hard-to-copy wedge against weak or generic alternatives — a specific job done distinctly better.",
    },
  },
  {
    id: "ai_feasibility",
    label: "AI Feasibility",
    weight: 15,
    description:
      "How well current AI/automation can deliver the core value, and how buildable an MVP is.",
    rubric: {
      none: "Core value needs capabilities beyond today's AI, depends on data that cannot be obtained, or AI adds little over a simple tool.",
      partial:
        "AI can do a meaningful part of the job with a human in the loop; some data or accuracy risk to design around.",
      full: "The core value maps cleanly onto proven AI building blocks (retrieval, classification, extraction, generation) with a small, buildable MVP.",
    },
  },
] as const;

/** Sum of all dimension weights. Asserted to equal 100 by the verdict test. */
export const IDEA_TOTAL_WEIGHT = IDEA_DIMENSIONS.reduce(
  (sum, d) => sum + d.weight,
  0,
);

export function getIdeaDimension(id: IdeaDimensionId): IdeaDimension {
  const d = IDEA_DIMENSIONS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown idea dimension: ${id}`);
  return d;
}
