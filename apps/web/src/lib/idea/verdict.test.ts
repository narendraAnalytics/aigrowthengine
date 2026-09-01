import { describe, expect, it } from "vitest";

import {
  IDEA_DIMENSIONS,
  IDEA_DIMENSION_IDS,
  IDEA_TOTAL_WEIGHT,
  type IdeaSignalLevel,
} from "./dimensions";
import { computeIdeaVerdict, recommendedIdeaPath } from "./verdict";

import type { IdeaSignals } from "./signals";

function signals(
  overrides: Partial<
    Record<(typeof IDEA_DIMENSION_IDS)[number], IdeaSignalLevel>
  >,
  base: IdeaSignalLevel = "partial",
): IdeaSignals {
  return Object.fromEntries(
    IDEA_DIMENSION_IDS.map((id) => [
      id,
      { level: overrides[id] ?? base, rationale: "test" },
    ]),
  ) as IdeaSignals;
}

describe("idea dimension weights", () => {
  it("sum to 100", () => {
    expect(IDEA_TOTAL_WEIGHT).toBe(100);
    expect(IDEA_DIMENSIONS.reduce((s, d) => s + d.weight, 0)).toBe(100);
  });
});

describe("computeIdeaVerdict", () => {
  it("scores all-full at 100 and all-none at 0", () => {
    expect(computeIdeaVerdict(signals({}, "full")).potentialScore).toBe(100);
    expect(computeIdeaVerdict(signals({}, "none")).potentialScore).toBe(0);
  });

  it("is deterministic", () => {
    const s = signals({ problem_strength: "full", ai_feasibility: "none" });
    expect(computeIdeaVerdict(s)).toEqual(computeIdeaVerdict(s));
  });

  it("RETHINK when the problem isn't evidenced", () => {
    const r = computeIdeaVerdict(signals({ problem_strength: "none" }, "full"));
    expect(r.verdict).toBe("rethink");
  });

  it("RETHINK when the score is very low", () => {
    const r = computeIdeaVerdict(
      signals({ problem_strength: "partial" }, "none"),
    );
    expect(r.verdict).toBe("rethink");
  });

  it("VALIDATE when there is no demand evidence and the score is not strong", () => {
    const r = computeIdeaVerdict(
      signals({ demand_evidence: "none", problem_strength: "full" }, "partial"),
    );
    expect(r.verdict).toBe("validate");
  });

  it("BUILD when score is strong, problem full, and some demand exists", () => {
    const r = computeIdeaVerdict(
      signals({ problem_strength: "full", demand_evidence: "partial" }, "full"),
    );
    expect(r.verdict).toBe("build");
  });

  it("REFINE for a promising idea with specific gaps", () => {
    const r = computeIdeaVerdict(
      signals(
        {
          problem_strength: "full",
          demand_evidence: "partial",
          ai_feasibility: "none",
        },
        "partial",
      ),
    );
    expect(r.verdict).toBe("refine");
  });

  it("breakdown points reconcile with the total", () => {
    const r = computeIdeaVerdict(signals({ market_potential: "full" }));
    const sum = r.breakdown.reduce((s, d) => s + d.points, 0);
    expect(Math.round(sum)).toBe(r.potentialScore);
  });
});

describe("recommendedIdeaPath", () => {
  it("targets the weakest dimensions first and always ends with the build step", () => {
    const r = computeIdeaVerdict(
      signals({ demand_evidence: "none", market_potential: "none" }, "full"),
    );
    const path = recommendedIdeaPath(r);
    expect(path.length).toBeGreaterThan(1);
    expect(path.length).toBeLessThanOrEqual(5);
    expect(path.at(-1)).toMatch(/MVP/i);
  });

  it("returns just the build step when every dimension is full", () => {
    const r = computeIdeaVerdict(signals({}, "full"));
    expect(recommendedIdeaPath(r)).toHaveLength(1);
  });
});
