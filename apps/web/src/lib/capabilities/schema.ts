import { z } from "zod";

/**
 * Capability Library — schema and controlled vocabularies.
 *
 * This module is the SOURCE OF TRUTH for what the platform can recommend.
 * Architecture rule (CLAUDE.md #2): the AI may only ever return capability ids
 * that exist here. Matching code must validate model output against `CAPABILITIES`
 * (see ./index.ts), never trust the prompt.
 *
 * Phase 0 status: structure + names + descriptions are real. Fields marked
 * `TODO(delivery)` — timelines, outcome metrics, delivery_status — MUST be
 * confirmed by whoever delivers these projects before any capability is shown to
 * a prospect. Do not invent numbers.
 */

/** The classifier's label set. Gemini tags a business problem with these. */
export const PROBLEM_TYPES = [
  "manual_document_processing",
  "invoice_po_matching",
  "customer_support_volume",
  "knowledge_retrieval_difficulty",
  "demand_forecasting_gap",
  "inventory_optimization",
  "repetitive_back_office_workflow",
  "data_scattered_no_single_view",
  "manual_reporting",
  "compliance_reporting_burden",
  "fraud_anomaly_detection",
  "claims_processing_slow",
  "contract_review_slow",
  "ai_governance_gap",
  "ai_security_exposure",
  "model_risk_unmanaged",
  // Sentinel: classifier is not confident enough to assign a real label.
  "no_confident_match",
] as const;

export const problemTypeSchema = z.enum(PROBLEM_TYPES);
export type ProblemType = z.infer<typeof problemTypeSchema>;

/** Industry controlled vocabulary (NAICS-lite, India context). */
export const INDUSTRIES = [
  "manufacturing",
  "distribution_wholesale",
  "ecommerce_retail",
  "banking",
  "insurance",
  "financial_services_other",
  "healthcare_providers",
  "pharma_lifesciences",
  "saas_it_services",
  "professional_services",
  "logistics_transport",
  "real_estate",
  "education",
  "telecom",
  "energy_utilities",
  "agritech",
  "automotive",
  "construction",
  "media",
  "public_sector",
] as const;

export const industrySchema = z.enum(INDUSTRIES);
export type Industry = z.infer<typeof industrySchema>;

/**
 * Delivery readiness. Drives what the platform is willing to say about a match.
 * - ga            — delivered for multiple clients, repeatable
 * - pilot         — delivered once or twice, still hardening
 * - design_partner — we can build it, seeking a first client to co-develop
 */
export const DELIVERY_STATUSES = ["ga", "pilot", "design_partner"] as const;
export const deliveryStatusSchema = z.enum(DELIVERY_STATUSES);
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const PRICING_MODELS = [
  "fixed_fee_pilot",
  "time_and_materials",
  "monthly_retainer",
  "outcome_based",
] as const;
export const pricingModelSchema = z.enum(PRICING_MODELS);

export const capabilitySchema = z.object({
  /** Stable slug. NEVER change once referenced by an assessment result. */
  id: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "id must be a lowercase kebab-case slug"),
  name: z.string().min(3),
  /** One sentence a salesperson could say out loud. */
  oneLiner: z.string().min(10),
  description: z.string().min(40),

  problemTypes: z.array(problemTypeSchema).min(1),
  industries: z.array(industrySchema).min(1),

  /** Systems we integrate with for this capability (free-form, India-common). */
  integrations: z.array(z.string()).default([]),
  /** Core tech / models used. */
  technologies: z.array(z.string()).min(1),
  /** Non-negotiable controls for this capability. */
  securityRequirements: z.array(z.string()).default([]),
  /** What the client must already have for delivery to be feasible. */
  prerequisites: z.array(z.string()).default([]),

  // --- Fields the delivery team must confirm before prospect exposure ---
  /** null until confirmed by delivery. */
  deliveryStatus: deliveryStatusSchema.nullable(),
  /** e.g. "6–10 weeks, 1 ML eng + 1 solutions eng". null until confirmed. */
  typicalImplementation: z.string().nullable(),
  /** Outcome statements. MUST be real/measured — empty until we have data. */
  typicalOutcomes: z.array(z.string()).default([]),
  pricingModel: z.array(pricingModelSchema).default([]),

  /** Case study ids — populated as projects complete. */
  relatedCaseStudies: z.array(z.string()).default([]),
});

export type Capability = z.infer<typeof capabilitySchema>;
