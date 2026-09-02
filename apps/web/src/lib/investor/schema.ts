import { z } from "zod";

/**
 * Contract for the Investor Room "Request Investor Access" form (V1).
 *
 *   POST /api/investor-access   capture an investor-interest request
 *
 * This is a lightweight interest capture, NOT the gated data room (Level 2 —
 * `approved` / `restricted` in `@/lib/security/investor-access`, still deferred
 * to Phase 7). Free-text here is stored + emailed to the team only; it is NEVER
 * sent to an LLM, so no prompt-injection screening is required.
 */

export const INVESTOR_ROLE_VALUES = [
  "founder",
  "angel",
  "vc",
  "pe",
  "corporate",
  "family_office",
  "other",
] as const;

export const INVESTOR_INTEREST_VALUES = [
  "investment",
  "strategic_partnership",
  "technology_partnership",
  "market_partnership",
  "other",
] as const;

export const INVESTOR_STAGE_VALUES = [
  "pre_seed",
  "seed",
  "series_a_plus",
  "growth",
  "not_specified",
] as const;

export const INVESTOR_GEOGRAPHY_VALUES = [
  "india",
  "apac",
  "us",
  "europe",
  "global",
] as const;

export const INVESTOR_REQUEST_STATUSES = [
  "new",
  "contacted",
  "approved",
  "declined",
] as const;
export type InvestorRequestStatus = (typeof INVESTOR_REQUEST_STATUSES)[number];

/** Display option lists for the form. */
export const INVESTOR_ROLES = [
  { value: "founder", label: "Founder" },
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "pe", label: "Private Equity" },
  { value: "corporate", label: "Corporate / Strategic Investor" },
  { value: "family_office", label: "Family Office" },
  { value: "other", label: "Other" },
] as const satisfies {
  value: (typeof INVESTOR_ROLE_VALUES)[number];
  label: string;
}[];

export const INVESTOR_INTERESTS = [
  { value: "investment", label: "Investment opportunity" },
  { value: "strategic_partnership", label: "Strategic partnership" },
  { value: "technology_partnership", label: "Technology partnership" },
  { value: "market_partnership", label: "Market / distribution partnership" },
  { value: "other", label: "Other" },
] as const satisfies {
  value: (typeof INVESTOR_INTEREST_VALUES)[number];
  label: string;
}[];

export const INVESTOR_STAGES = [
  { value: "pre_seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a_plus", label: "Series A+" },
  { value: "growth", label: "Growth" },
  { value: "not_specified", label: "Not specified" },
] as const satisfies {
  value: (typeof INVESTOR_STAGE_VALUES)[number];
  label: string;
}[];

export const INVESTOR_GEOGRAPHIES = [
  { value: "india", label: "India" },
  { value: "apac", label: "APAC" },
  { value: "us", label: "US" },
  { value: "europe", label: "Europe" },
  { value: "global", label: "Global" },
] as const satisfies {
  value: (typeof INVESTOR_GEOGRAPHY_VALUES)[number];
  label: string;
}[];

export const investorRoleSchema = z.enum(INVESTOR_ROLE_VALUES);
export const investorInterestSchema = z.enum(INVESTOR_INTEREST_VALUES);
export const investorStageSchema = z.enum(INVESTOR_STAGE_VALUES);
export const investorGeographySchema = z.enum(INVESTOR_GEOGRAPHY_VALUES);

export type InvestorRole = z.infer<typeof investorRoleSchema>;
export type InvestorInterest = z.infer<typeof investorInterestSchema>;
export type InvestorStage = z.infer<typeof investorStageSchema>;
export type InvestorGeography = z.infer<typeof investorGeographySchema>;

export const submitInvestorInterestSchema = z
  .object({
    fullName: z.string().trim().min(1, "Your name is required").max(200),
    workEmail: z
      .string()
      .trim()
      .min(1, "Work email is required")
      .email("Enter a valid email")
      .max(320),
    company: z.string().trim().min(1, "Company or fund is required").max(200),
    role: investorRoleSchema.optional(),
    interests: z
      .array(investorInterestSchema)
      .max(INVESTOR_INTEREST_VALUES.length),
    stage: investorStageSchema.optional(),
    geography: investorGeographySchema.optional(),
    // "" from an untouched textarea is allowed; the server coerces blank -> null.
    learnMore: z.string().trim().max(2000).optional(),
  })
  .strict();

export type SubmitInvestorInterest = z.infer<
  typeof submitInvestorInterestSchema
>;
