import { describe, expect, it } from "vitest";

import { FACTOR_IDS } from "@/lib/scoring/factors";

import { deriveAssessmentOutcome, tryParseSignals } from "./run-assessment";

function modelResponse(
  overrides: Partial<{
    problem_types: string[];
    signalLevel: "none" | "partial" | "full";
    summary: string;
  }> = {},
) {
  const level = overrides.signalLevel ?? "full";
  return {
    problem_types: overrides.problem_types ?? [
      "invoice_po_matching",
      "repetitive_back_office_workflow",
    ],
    signals: Object.fromEntries(
      FACTOR_IDS.map((id) => [id, { level, rationale: `evidence for ${id}` }]),
    ),
    summary:
      overrides.summary ?? "Finance team manually matches invoices to POs.",
  };
}

describe("tryParseSignals", () => {
  it("parses a valid JSON string", () => {
    const out = tryParseSignals(JSON.stringify(modelResponse()));
    expect(out.ok).toBe(true);
  });

  it("fails on non-JSON", () => {
    expect(tryParseSignals("not json").ok).toBe(false);
  });

  it("fails on JSON that violates the schema", () => {
    expect(tryParseSignals(JSON.stringify({ problem_types: [] })).ok).toBe(
      false,
    );
  });
});

describe("deriveAssessmentOutcome", () => {
  it("matches a finance invoice problem and scores it high", () => {
    const parsed = tryParseSignals(JSON.stringify(modelResponse()));
    if (!parsed.ok) throw parsed.error;

    const out = deriveAssessmentOutcome(parsed.value, "manufacturing");

    expect(out.problemTypes).toContain("invoice_po_matching");
    expect(out.match.noConfidentMatch).toBe(false);
    expect(out.match.matches[0]?.capabilityId).toBe("invoice-po-grn-matching");
    expect(out.score.band).toBe("high");
    expect(out.score.score).toBeGreaterThanOrEqual(75);
  });

  it("overrides solution_fit from the deterministic match, not the model", () => {
    // Model says every factor is 'full', including solution_fit.
    const parsed = tryParseSignals(JSON.stringify(modelResponse()));
    if (!parsed.ok) throw parsed.error;

    // Off-domain industry weakens the match → solution_fit should not stay 'full'.
    const strong = deriveAssessmentOutcome(parsed.value, "manufacturing");
    const weak = deriveAssessmentOutcome(parsed.value, "education");

    expect(strong.signals.solution_fit.rationale).toMatch(/capability match/i);
    expect(weak.signals.solution_fit.level).not.toBe("full");
  });

  it("takes the no-confident-match path for an off-domain problem", () => {
    const parsed = tryParseSignals(
      JSON.stringify(
        modelResponse({
          problem_types: ["no_confident_match"],
          signalLevel: "none",
        }),
      ),
    );
    if (!parsed.ok) throw parsed.error;

    const out = deriveAssessmentOutcome(parsed.value, "real_estate");

    expect(out.problemTypes).toEqual([]);
    expect(out.match.noConfidentMatch).toBe(true);
    expect(out.match.matches).toEqual([]);
    expect(out.signals.solution_fit.level).toBe("none");
  });

  it("recomputes the same score from the persisted signals", () => {
    const parsed = tryParseSignals(JSON.stringify(modelResponse()));
    if (!parsed.ok) throw parsed.error;
    const out = deriveAssessmentOutcome(parsed.value, "manufacturing");
    // breakdown points sum to the total (deterministic reconciliation).
    const summed = Math.round(
      out.score.breakdown.reduce((s, f) => s + f.points, 0),
    );
    expect(summed).toBe(out.score.score);
  });
});
