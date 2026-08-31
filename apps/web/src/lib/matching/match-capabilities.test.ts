import { describe, expect, it } from "vitest";

import { classifyMatch } from "@/lib/scoring/match";

import {
  MATCHER_VERSION,
  NO_CONFIDENT_MATCH_THRESHOLD,
  matchCapabilities,
} from "./match-capabilities";

describe("matchCapabilities", () => {
  it("is versioned", () => {
    expect(MATCHER_VERSION).toBe("1.0.0");
  });

  it("matches a finance invoice-matching problem to the 3-way matching capability", () => {
    const result = matchCapabilities(
      ["invoice_po_matching", "repetitive_back_office_workflow"],
      "manufacturing",
    );

    expect(result.noConfidentMatch).toBe(false);
    expect(result.matches[0]?.capabilityId).toBe("invoice-po-grn-matching");
    expect(result.matches[0]?.confidence).toBeGreaterThanOrEqual(0.75);
    expect(["strong", "partial"]).toContain(result.matches[0]?.matchClass);
    expect(result.matches[0]?.rank).toBe(1);
    expect(result.bestConfidence).toBe(result.matches[0]?.confidence);
  });

  it("returns at most the top 3 matches, ranked by confidence descending", () => {
    const result = matchCapabilities(
      ["manual_document_processing", "repetitive_back_office_workflow"],
      "healthcare_providers",
    );

    expect(result.matches.length).toBeLessThanOrEqual(3);
    const confidences = result.matches.map((m) => m.confidence);
    expect(confidences).toEqual([...confidences].sort((a, b) => b - a));
    expect(result.matches.map((m) => m.rank)).toEqual(
      result.matches.map((_, i) => i + 1),
    );
  });

  it("gives a lower confidence when the industry does not match", () => {
    const withIndustry = matchCapabilities(
      ["invoice_po_matching"],
      "manufacturing",
    ).matches.find((m) => m.capabilityId === "invoice-po-grn-matching");
    const withoutIndustry = matchCapabilities(
      ["invoice_po_matching"],
      "education",
    ).matches.find((m) => m.capabilityId === "invoice-po-grn-matching");

    expect(withIndustry?.confidence).toBeGreaterThan(
      withoutIndustry?.confidence ?? 0,
    );
  });

  it("drops unknown problem types and the no_confident_match sentinel", () => {
    const result = matchCapabilities(
      ["totally_made_up", "no_confident_match"],
      "manufacturing",
    );
    expect(result.noConfidentMatch).toBe(true);
    expect(result.matches).toEqual([]);
  });

  it("flags no_confident_match for an empty problem-type list", () => {
    const result = matchCapabilities([], "manufacturing");
    expect(result.noConfidentMatch).toBe(true);
    expect(result.bestConfidence).toBe(0);
  });

  it("flags no_confident_match when the best confidence is below threshold", () => {
    // A single weak signal against an unrelated industry.
    const result = matchCapabilities(["manual_reporting"], "real_estate");
    if (result.bestConfidence < NO_CONFIDENT_MATCH_THRESHOLD) {
      expect(result.noConfidentMatch).toBe(true);
    }
  });

  it("rounds confidence to 3 decimal places and keeps it in [0,1]", () => {
    const result = matchCapabilities(
      ["manual_document_processing", "contract_review_slow"],
      "banking",
    );
    for (const m of result.matches) {
      expect(m.confidence).toBeGreaterThanOrEqual(0);
      expect(m.confidence).toBeLessThanOrEqual(1);
      expect(Number(m.confidence.toFixed(3))).toBe(m.confidence);
      expect(m.matchClass).toBe(classifyMatch(m.confidence));
    }
  });
});
