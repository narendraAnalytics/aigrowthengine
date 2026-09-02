import { describe, expect, it } from "vitest";

import { submitCallRequestSchema } from "./schema";

const base = {
  fullName: "Asha Rao",
  phone: "+91 98765 43210",
  requirement: "We spend 30 hours a week reconciling invoices by hand.",
  consent: true,
};

describe("submitCallRequestSchema", () => {
  it("accepts a minimal valid submission and normalises the phone", () => {
    const parsed = submitCallRequestSchema.parse(base);
    expect(parsed.phone).toBe("+919876543210");
    expect(parsed.company).toBeUndefined();
    expect(parsed.email).toBeUndefined();
  });

  it("adds a leading + when the country code is bare", () => {
    expect(
      submitCallRequestSchema.parse({ ...base, phone: "919876543210" }).phone,
    ).toBe("+919876543210");
  });

  it("rejects a submission without consent", () => {
    expect(
      submitCallRequestSchema.safeParse({ ...base, consent: false }).success,
    ).toBe(false);
  });

  it("rejects a too-short requirement", () => {
    expect(
      submitCallRequestSchema.safeParse({ ...base, requirement: "help" })
        .success,
    ).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    expect(
      submitCallRequestSchema.safeParse({ ...base, phone: "12" }).success,
    ).toBe(false);
  });

  it("treats an empty email string as omitted", () => {
    expect(
      submitCallRequestSchema.parse({ ...base, email: "" }).email,
    ).toBeUndefined();
  });

  it("keeps a provided company and email", () => {
    const parsed = submitCallRequestSchema.parse({
      ...base,
      company: "Acme Foods",
      email: "asha@acme.example",
    });
    expect(parsed.company).toBe("Acme Foods");
    expect(parsed.email).toBe("asha@acme.example");
  });
});
