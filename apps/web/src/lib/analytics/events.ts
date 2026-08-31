/**
 * Analytics event catalogue (Phase 0.6).
 *
 * PostHog is the sink (not yet wired — Phase 2). This module is the contract:
 * every event that may be sent, its properties, its funnel stage and its owner.
 * Nothing calls `track(name, props)` with a name that isn't here.
 *
 * Conventions:
 *  - event + property names are snake_case
 *  - the schema is versioned; bump ANALYTICS_SCHEMA_VERSION on any breaking change
 *    to an event's properties and send it as `schema_version` on every event
 */

export const ANALYTICS_SCHEMA_VERSION = 1;

export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const PROPERTY_TYPES = [
  "string",
  "number",
  "boolean",
  "iso_datetime",
  "string[]",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Owner = the team accountable for the event's meaning + correctness. */
export const EVENT_OWNERS = ["product", "growth", "ai", "security"] as const;
export type EventOwner = (typeof EVENT_OWNERS)[number];

export type AnalyticsEventDef = {
  name: string;
  owner: EventOwner;
  description: string;
  /** When this fires — a short trigger description. */
  firesWhen: string;
  /** Funnel stage this event marks, if any (see funnel.ts). */
  funnelStage: string | null;
  /** Event-specific properties (on top of the base properties). */
  properties: Record<string, PropertyType>;
};

/**
 * Base properties attached to EVERY event by the tracking layer — do not
 * redeclare these per event.
 */
export const BASE_PROPERTIES: Record<string, PropertyType> = {
  schema_version: "number",
  distinct_id: "string",
  organization_id: "string", // omitted for anonymous / personal-scope events
  path: "string",
  timestamp: "iso_datetime",
};

function evt(
  name: string,
  owner: EventOwner,
  description: string,
  firesWhen: string,
  funnelStage: string | null,
  properties: Record<string, PropertyType> = {},
): AnalyticsEventDef {
  return { name, owner, description, firesWhen, funnelStage, properties };
}

export const ANALYTICS_EVENTS: readonly AnalyticsEventDef[] = [
  // --- top of funnel ---
  evt("page_viewed", "product", "A page was viewed", "Client-side route change / initial load", "visitor", {
    referrer: "string",
    utm_source: "string",
  }),
  evt(
    "assessment_started",
    "product",
    "A user began the assessment flow",
    "First assessment question rendered after auth",
    "assessment_started",
  ),
  evt(
    "assessment_completed",
    "product",
    "A user submitted all required assessment answers",
    "POST /api/v1/assessments succeeds",
    "assessment_completed",
    { assessment_id: "string", industry: "string", question_count: "number" },
  ),
  evt(
    "assessment_failed",
    "ai",
    "The assessment pipeline could not produce a result",
    "Scoring/matching pipeline throws or times out",
    null,
    { assessment_id: "string", reason: "string" },
  ),
  evt(
    "assessment_scored",
    "ai",
    "A result + deterministic lead score was produced",
    "assessment_results row written",
    null,
    {
      assessment_id: "string",
      lead_score: "number",
      score_band: "string",
      scoring_model_version: "string",
      duration_ms: "number",
    },
  ),

  // --- matching ---
  evt(
    "capability_match_shown",
    "product",
    "One or more capability matches were shown to the user",
    "Result page renders with >=1 match",
    "capability_matched",
    { assessment_id: "string", capability_ids: "string[]", top_confidence: "number" },
  ),
  evt(
    "no_confident_match_shown",
    "product",
    "The 'we can't confidently match this' result was shown",
    "Result page renders with no_confident_match = true",
    null,
    { assessment_id: "string" },
  ),
  evt(
    "expert_review_requested",
    "growth",
    "A user requested an expert review",
    "POST /api/v1/assessments/:id/expert-review succeeds",
    null,
    { assessment_id: "string", from_no_match: "boolean" },
  ),
  evt(
    "lead_score_overridden",
    "growth",
    "Staff manually overrode a lead score",
    "CRM score override saved (reason mandatory)",
    null,
    { assessment_id: "string", old_score: "number", new_score: "number" },
  ),
  evt(
    "ai_match_corrected",
    "ai",
    "Staff corrected an AI capability match (the data-moat signal)",
    "A match is added/removed/re-ranked by a human",
    null,
    { assessment_id: "string", capability_id: "string", action: "string" },
  ),

  // --- down funnel (CRM — Phase 4/5) ---
  evt("qualified_opportunity_created", "growth", "An assessment became a qualified opportunity", "Lead marked qualified in CRM", "qualified", {
    assessment_id: "string",
    lead_score: "number",
  }),
  evt("consultation_booked", "growth", "A consultation was scheduled", "Consultation created in CRM", "consultation", {
    opportunity_id: "string",
  }),
  evt("proposal_sent", "growth", "A proposal/pilot offer was sent", "Proposal marked sent", "proposal", {
    opportunity_id: "string",
  }),
  evt("pilot_started", "growth", "A paid pilot began", "Pilot project created", "pilot", { opportunity_id: "string" }),
  evt("deal_won", "growth", "A pilot converted to a project / win", "Opportunity marked won", "won", {
    opportunity_id: "string",
  }),

  // --- quality / security signals ---
  evt(
    "structured_output_invalid",
    "ai",
    "A model response failed schema validation",
    "parseLeadSignals / structured-output parse throws",
    null,
    { stage: "string" },
  ),
  evt(
    "ai_hallucination_flagged",
    "ai",
    "A human flagged a model output as a critical hallucination",
    "Reviewer flags an output in QA",
    null,
    { assessment_id: "string", severity: "string" },
  ),
  evt(
    "assessment_usefulness_rated",
    "product",
    "A user rated how useful the assessment was",
    "Post-result feedback prompt answered",
    null,
    { assessment_id: "string", useful: "boolean", rating: "number" },
  ),
] as const;

export const ANALYTICS_EVENT_NAMES = ANALYTICS_EVENTS.map((e) => e.name);
const EVENT_SET = new Set<string>(ANALYTICS_EVENT_NAMES);

export function isKnownEvent(name: string): boolean {
  return EVENT_SET.has(name);
}

export function analyticsEventDef(name: string): AnalyticsEventDef | undefined {
  return ANALYTICS_EVENTS.find((e) => e.name === name);
}
