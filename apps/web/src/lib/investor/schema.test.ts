import { describe, expect, it } from "vitest";

import { submitInvestorInterestSchema } from "./schema";

const base = {
  fullName: "Ada Lovelace",
  workEmail: "ada@fund.vc",
  company: "Analytical Ventures",
  interests: ["investment"],
};

describe("submitInvestorInterestSchema", () => {
  it("accepts a minimal valid request", () => {
    const parsed = submitInvestorInterestSchema.parse(base);
    expect(parsed.fullName).toBe("Ada Lovelace");
    expect(parsed.interests).toEqual(["investment"]);
    expect(parsed.role).toBeUndefined();
  });

  it("accepts a fully populated request", () => {
    const parsed = submitInvestorInterestSchema.parse({
      ...base,
      role: "vc",
      interests: ["investment", "strategic_partnership"],
      stage: "seed",
      geography: "global",
      learnMore: "Keen to understand the TRiSM roadmap.",
    });
    expect(parsed.stage).toBe("seed");
  });

  it("rejects a missing name", () => {
    expect(
      submitInvestorInterestSchema.safeParse({ ...base, fullName: "" }).success,
    ).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(
      submitInvestorInterestSchema.safeParse({ ...base, workEmail: "nope" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(
      submitInvestorInterestSchema.safeParse({ ...base, role: "banker" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown interest value", () => {
    expect(
      submitInvestorInterestSchema.safeParse({ ...base, interests: ["moon"] })
        .success,
    ).toBe(false);
  });

  it("trims a whitespace-only learnMore to an empty string (server coerces to null)", () => {
    const parsed = submitInvestorInterestSchema.parse({
      ...base,
      learnMore: "   ",
    });
    expect(parsed.learnMore).toBe("");
  });

  it("strips unknown keys via strict()", () => {
    expect(
      submitInvestorInterestSchema.safeParse({ ...base, sneaky: 1 }).success,
    ).toBe(false);
  });
});
