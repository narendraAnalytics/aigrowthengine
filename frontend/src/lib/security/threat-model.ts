/**
 * STRIDE threat model (Phase 0.5) for the four highest-risk components.
 *
 * This is a STARTER model. Every entry is `status: "needs_review"` until the
 * security owner has walked it. Extend as components ship. check:security asserts
 * all four components are covered and every threat has a mitigation.
 *
 * STRIDE: Spoofing, Tampering, Repudiation, Information disclosure,
 *         Denial of service, Elevation of privilege.
 */

export const THREAT_COMPONENTS = [
  "assessment_intake",
  "file_access",
  "investor_room",
  "ai_gateway",
] as const;
export type ThreatComponent = (typeof THREAT_COMPONENTS)[number];

export const STRIDE = [
  "spoofing",
  "tampering",
  "repudiation",
  "information_disclosure",
  "denial_of_service",
  "elevation_of_privilege",
] as const;
export type StrideCategory = (typeof STRIDE)[number];

export type ThreatStatus = "needs_review" | "accepted" | "mitigated";

export type Threat = {
  component: ThreatComponent;
  stride: StrideCategory;
  threat: string;
  mitigation: string;
  status: ThreatStatus;
};

export const THREATS: readonly Threat[] = [
  // --- assessment_intake ---
  {
    component: "assessment_intake",
    stride: "tampering",
    threat: "Prompt injection in free-text answers steers the classifier or leaks the system prompt.",
    mitigation:
      "Treat answers as untrusted data, not instructions; structured-output schema (signals.ts); output validated against controlled vocabularies; no tool access from the classifier.",
    status: "needs_review",
  },
  {
    component: "assessment_intake",
    stride: "denial_of_service",
    threat: "Automated mass submissions burn Gemini token budget.",
    mitigation:
      "Auth required to submit; per-user + per-org rate limits; Idempotency-Key; cost-per-assessment monitored (roadmap 0.5 control budget).",
    status: "needs_review",
  },
  {
    component: "assessment_intake",
    stride: "information_disclosure",
    threat: "One prospect reads another prospect's assessment or result.",
    mitigation:
      "TenantScope on every read (tenant.ts); authorize at the resource (rbac.ts assessment:read:own/org); integration tests prove isolation.",
    status: "needs_review",
  },
  {
    component: "assessment_intake",
    stride: "repudiation",
    threat: "Dispute over what was submitted or what score was shown.",
    mitigation: "assessment.submitted / assessment.scored audit events with immutable payload snapshot + scoring_model_version.",
    status: "needs_review",
  },

  // --- file_access ---
  {
    component: "file_access",
    stride: "information_disclosure",
    threat: "Guessable or long-lived file URLs expose tenant documents.",
    mitigation:
      "Private R2 buckets; short-TTL presigned URLs generated per request after an authz check; no public bucket policy; SW never caches these responses (CLAUDE.md #6).",
    status: "needs_review",
  },
  {
    component: "file_access",
    stride: "elevation_of_privilege",
    threat: "A client user accesses another tenant's files by changing an id.",
    mitigation: "File records carry organization_id; presign path re-checks TenantScope + rbac; deny by default.",
    status: "needs_review",
  },
  {
    component: "file_access",
    stride: "tampering",
    threat: "Malicious upload (malware, oversized, wrong type) processed downstream.",
    mitigation: "Type + size limits; content scanning before processing; store originals immutably; process copies.",
    status: "needs_review",
  },

  // --- investor_room ---
  {
    component: "investor_room",
    stride: "elevation_of_privilege",
    threat: "A `registered` investor views `restricted` materials (cap table, contracts).",
    mitigation: "meetsInvestorAccess() checked at each document; access level stored server-side; grants are explicit + audited.",
    status: "needs_review",
  },
  {
    component: "investor_room",
    stride: "repudiation",
    threat: "Dispute over who accessed which materials and when.",
    mitigation: "investor_room.access_granted/revoked/document_viewed audit events; 7-year retention.",
    status: "needs_review",
  },
  {
    component: "investor_room",
    stride: "information_disclosure",
    threat: "Revoked investor retains a cached copy or a still-valid link.",
    mitigation: "Short presigned TTLs; revocation invalidates sessions; watermarking of sensitive docs; no client-side caching.",
    status: "needs_review",
  },

  // --- ai_gateway ---
  {
    component: "ai_gateway",
    stride: "information_disclosure",
    threat: "Tenant PII sent to the model is retained or logged beyond policy.",
    mitigation:
      "Minimise what is sent; no PII in prompt logs beyond the retention window; provider data-processing terms reviewed; India residency where required.",
    status: "needs_review",
  },
  {
    component: "ai_gateway",
    stride: "tampering",
    threat: "Model output used as authoritative (a score, a capability id it invented).",
    mitigation:
      "Model emits signals only; deterministic scoring (score.ts); capability ids validated against CAPABILITY_IDS; every outbound artifact needs recorded human approval (CLAUDE.md #7).",
    status: "needs_review",
  },
  {
    component: "ai_gateway",
    stride: "denial_of_service",
    threat: "Runaway or looping calls exhaust budget / rate limits.",
    mitigation: "Per-request token ceilings; timeouts; circuit breaker; ai_gateway.request audit with token counts; budget alerts.",
    status: "needs_review",
  },
  {
    component: "ai_gateway",
    stride: "repudiation",
    threat: "No record of what was asked of the model or why.",
    mitigation: "ai_gateway.request / ai_gateway.blocked audit events (model, purpose, tokens, outcome).",
    status: "needs_review",
  },
];

export function threatsForComponent(component: ThreatComponent): Threat[] {
  return THREATS.filter((t) => t.component === component);
}
