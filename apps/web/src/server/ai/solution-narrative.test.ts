import { describe, expect, it } from "vitest";

import {
  parseNarrative,
  serializeNarrative,
  templatedNarrative,
} from "./solution-narrative";

import type { CapabilityMatch } from "@/lib/matching";

const match = (id: string, name: string): CapabilityMatch => ({
  capabilityId: id,
  name,
  confidence: 0.7,
  matchClass: "partial",
  rationale: "matched",
  rank: 1,
});

describe("templatedNarrative", () => {
  it("summarises the matched capabilities without inventing outcomes", () => {
    const n = templatedNarrative([
      match(
        "invoice-po-grn-matching",
        "Invoice–PO–GRN 3-Way Matching Automation",
      ),
    ]);
    expect(n.source).toBe("templated");
    expect(n.summary).toContain("Invoice–PO–GRN 3-Way Matching Automation");
    expect(n.steps.length).toBeGreaterThan(0);
    // no fabricated metrics / timelines
    expect(n.summary + n.steps.join(" ")).not.toMatch(
      /\d+\s*(%|weeks?|months?)/i,
    );
  });

  it("gives an expert-review message when nothing matched", () => {
    const n = templatedNarrative([]);
    expect(n.summary.toLowerCase()).toContain("specialist");
  });
});

describe("narrative serialisation", () => {
  it("round-trips through the persisted form", () => {
    const original = templatedNarrative([match("x", "X Capability")]);
    const back = parseNarrative(serializeNarrative(original));
    expect(back).toEqual({ summary: original.summary, steps: original.steps });
  });

  it("returns null for empty / malformed input", () => {
    expect(parseNarrative(null)).toBeNull();
    expect(parseNarrative("not json")).toBeNull();
    expect(parseNarrative(JSON.stringify({ summary: 1 }))).toBeNull();
  });
});
