import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Reference tables mirroring Clerk. Clerk stays the source of truth; these rows
 * exist so app data can join against a stable local id and be queried in SQL.
 * All ids are Clerk's own string ids (`user_…`, `org_…`, `orgmem_…`).
 *
 * NOTE: this layer is deliberately framework-agnostic — it will be ported to the
 * FastAPI `apps/api` service (SQLAlchemy) later. Keep it free of Next/Clerk imports.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Soft-delete convention: null = active. Reads should filter `deleted_at IS NULL`.
  // Nothing sets this yet — only a future delete path (Clerk webhook / admin
  // action) would. `deleteUser()` is still a hard delete for now.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  ...timestamps,
});

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // Clerk organization id
  name: text("name").notNull(),
  slug: text("slug"),
  imageUrl: text("image_url"),
  ...timestamps,
});

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: text("id").primaryKey(), // Clerk membership id
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // e.g. "org:admin", "org:member"
    ...timestamps,
  },
  (t) => [
    uniqueIndex("organization_memberships_org_user_uq").on(
      t.organizationId,
      t.userId,
    ),
    index("organization_memberships_user_idx").on(t.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * Assessment domain (Phase 0.4 ERD).
 *
 * Flow: a signed-in prospect submits `assessments.answers` -> the engine writes
 * one `assessment_results` row (signals + deterministic score) -> zero or more
 * `capability_matches`. Below the confident-match threshold the prospect can file
 * an `expert_review_requests`. Lead/CRM tables are Phase 4, not here.
 *
 * `signals` / `problem_types` are jsonb validated in app code (see
 * `@/lib/scoring` and `@/lib/capabilities`), not by DB constraints.
 * ------------------------------------------------------------------------- */

export const assessmentStatus = pgEnum("assessment_status", [
  "submitted",
  "analyzing",
  "scored",
  "needs_expert_review",
  "failed",
]);

export const scoreBand = pgEnum("score_band", ["high", "medium", "low"]);

export const matchClass = pgEnum("match_class", ["strong", "partial", "none"]);

export const expertReviewStatus = pgEnum("expert_review_status", [
  "open",
  "contacted",
  "closed",
]);

export const assessmentEmailKind = pgEnum("assessment_email_kind", [
  "team_alert", // internal lead notification, sent automatically
  "client_result", // to the prospect — gated by a recorded human approval
]);

export const assessmentEmailStatus = pgEnum("assessment_email_status", [
  "pending_approval", // client_result: drafted, awaiting a staff approve+send
  "approved", // staff approved; send in progress
  "sent",
  "failed",
]);

export const narrativeSource = pgEnum("narrative_source", ["ai", "templated"]);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Null while a prospect has no active Clerk org.
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    status: assessmentStatus("status").notNull().default("submitted"),
    // Record<questionId, string | string[]> — shape enforced in app code.
    answers: jsonb("answers").notNull(),
    // Contact details — collected on the form, NEVER sent to the LLM.
    // Nullable: rows created before Phase 3 email capture have none.
    contactEmail: text("contact_email"),
    contactCompany: text("contact_company"),
    contactNote: text("contact_note"),
    ...timestamps,
  },
  (t) => [
    index("assessments_user_idx").on(t.userId),
    index("assessments_organization_idx").on(t.organizationId),
  ],
);

export const assessmentResults = pgTable("assessment_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .unique()
    .references(() => assessments.id, { onDelete: "cascade" }),
  // string[] of problem_type vocabulary values.
  problemTypes: jsonb("problem_types").notNull(),
  industry: text("industry"),
  // The validated LeadSignals object ({ [factorId]: { level, rationale } }).
  signals: jsonb("signals").notNull(),
  leadScore: integer("lead_score").notNull(),
  scoreBand: scoreBand("score_band").notNull(),
  scoringModelVersion: text("scoring_model_version").notNull(),
  summary: text("summary"),
  noConfidentMatch: boolean("no_confident_match").notNull().default(false),
  // "How this could be solved" narrative, grounded in the matched capabilities.
  // `source` records whether it came from the 2nd Groq call or the deterministic
  // templated fallback (used on rate-limit / failure).
  solutionNarrative: text("solution_narrative"),
  solutionNarrativeSource: narrativeSource("solution_narrative_source"),
  ...timestamps,
});

/* Outbound assessment emails (Phase 3). `team_alert` sends automatically.
 * `client_result` is created as `pending_approval` and only sent after a staff
 * member approves — the approval + the exact sent body are recorded here
 * (CLAUDE.md #7: every outbound artifact needs a recorded human approval). */
export const assessmentEmails = pgTable(
  "assessment_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    kind: assessmentEmailKind("kind").notNull(),
    status: assessmentEmailStatus("status").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    // sha256 of `${toEmail}\n${subject}\n${bodyHtml}` — the version identity.
    bodyHash: text("body_hash").notNull(),
    // Set when a staff member approves a client_result email.
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    // The bodyHash that was approved; a send is refused if bodyHash drifts.
    approvedHash: text("approved_hash"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    ...timestamps,
  },
  (t) => [
    index("assessment_emails_assessment_idx").on(t.assessmentId),
    index("assessment_emails_status_idx").on(t.status),
    uniqueIndex("assessment_emails_assessment_kind_uq").on(
      t.assessmentId,
      t.kind,
    ),
  ],
);

export const capabilityMatches = pgTable(
  "capability_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentResultId: uuid("assessment_result_id")
      .notNull()
      .references(() => assessmentResults.id, { onDelete: "cascade" }),
    // Validated against CAPABILITY_IDS in app code before insert (CLAUDE.md #2).
    capabilityId: text("capability_id").notNull(),
    // 0..1; drizzle returns numeric as string.
    confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
    matchClass: matchClass("match_class").notNull(),
    rationale: text("rationale"),
    rank: integer("rank").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("capability_matches_result_capability_uq").on(
      t.assessmentResultId,
      t.capabilityId,
    ),
    index("capability_matches_capability_idx").on(t.capabilityId),
  ],
);

export const expertReviewRequests = pgTable(
  "expert_review_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    note: text("note"),
    status: expertReviewStatus("status").notNull().default("open"),
    ...timestamps,
  },
  (t) => [
    index("expert_review_requests_status_idx").on(t.status),
    // Tenant-scoped: every tenant-filtered query hits organization_id.
    index("expert_review_requests_organization_idx").on(t.organizationId),
  ],
);

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [assessments.organizationId],
    references: [organizations.id],
  }),
  result: one(assessmentResults, {
    fields: [assessments.id],
    references: [assessmentResults.assessmentId],
  }),
  expertReviewRequests: many(expertReviewRequests),
  emails: many(assessmentEmails),
}));

export const assessmentEmailsRelations = relations(
  assessmentEmails,
  ({ one }) => ({
    assessment: one(assessments, {
      fields: [assessmentEmails.assessmentId],
      references: [assessments.id],
    }),
  }),
);

export const assessmentResultsRelations = relations(
  assessmentResults,
  ({ one, many }) => ({
    assessment: one(assessments, {
      fields: [assessmentResults.assessmentId],
      references: [assessments.id],
    }),
    matches: many(capabilityMatches),
  }),
);

export const capabilityMatchesRelations = relations(
  capabilityMatches,
  ({ one }) => ({
    result: one(assessmentResults, {
      fields: [capabilityMatches.assessmentResultId],
      references: [assessmentResults.id],
    }),
  }),
);

export const expertReviewRequestsRelations = relations(
  expertReviewRequests,
  ({ one }) => ({
    assessment: one(assessments, {
      fields: [expertReviewRequests.assessmentId],
      references: [assessments.id],
    }),
    user: one(users, {
      fields: [expertReviewRequests.userId],
      references: [users.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * AI Idea Assessment domain (Phase 3, "AI Ideas" path).
 *
 * Parallel to the business assessment but a different question: "is this new
 * idea worth building?". Flow: a signed-in founder submits `idea_assessments
 * .answers` -> one Groq signals call -> deterministic `computeIdeaVerdict()`
 * writes one `idea_assessment_results` row (signals + potential score + a
 * BUILD/REFINE/VALIDATE/RETHINK verdict). The result is emailed to the address
 * entered on the form (auto-send — same client-result exception as CLAUDE.md #7).
 *
 * `signals` / `ai_approaches` / `recommended_path` are jsonb validated in app
 * code (see @/lib/idea), not by DB constraints.
 * ------------------------------------------------------------------------- */

export const ideaAssessmentStatus = pgEnum("idea_assessment_status", [
  "analyzing",
  "scored",
  "failed",
]);

export const ideaVerdict = pgEnum("idea_verdict", [
  "build",
  "refine",
  "validate",
  "rethink",
]);

export const ideaScoreBand = pgEnum("idea_score_band", [
  "strong",
  "promising",
  "moderate",
  "weak",
]);

export const ideaEmailKind = pgEnum("idea_email_kind", [
  "client_result",
  "team_alert",
]);

export const ideaEmailStatus = pgEnum("idea_email_status", ["sent", "failed"]);

export const ideaAssessments = pgTable(
  "idea_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    status: ideaAssessmentStatus("status").notNull().default("analyzing"),
    // Record<questionId, string> — shape enforced in app code.
    answers: jsonb("answers").notNull(),
    // Collected on the form, emailed the result. NEVER sent to the LLM.
    contactEmail: text("contact_email"),
    contactName: text("contact_name"),
    // Richer lead details, captured after the result via the "talk to us" CTA.
    leadName: text("lead_name"),
    leadCompany: text("lead_company"),
    leadPhone: text("lead_phone"),
    leadNote: text("lead_note"),
    ...timestamps,
  },
  (t) => [
    index("idea_assessments_user_idx").on(t.userId),
    index("idea_assessments_organization_idx").on(t.organizationId),
  ],
);

export const ideaAssessmentResults = pgTable("idea_assessment_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  ideaAssessmentId: uuid("idea_assessment_id")
    .notNull()
    .unique()
    .references(() => ideaAssessments.id, { onDelete: "cascade" }),
  // The validated IdeaSignals object ({ [dimensionId]: { level, rationale } }).
  signals: jsonb("signals").notNull(),
  potentialScore: integer("potential_score").notNull(),
  scoreBand: ideaScoreBand("score_band").notNull(),
  verdict: ideaVerdict("verdict").notNull(),
  verdictReason: text("verdict_reason").notNull(),
  verdictModelVersion: text("verdict_model_version").notNull(),
  summary: text("summary"),
  mainRisk: text("main_risk"),
  // string[] — illustrative AI building blocks from the model.
  aiApproaches: jsonb("ai_approaches").notNull().default([]),
  // string[] — deterministic recommended next steps.
  recommendedPath: jsonb("recommended_path").notNull().default([]),
  ...timestamps,
});

/* Outbound idea-assessment emails. `client_result` auto-sends to the form
 * address (CLAUDE.md #7 exception); `team_alert` auto-sends to the internal
 * inbox. One row per (assessment, kind); no approval workflow. */
export const ideaAssessmentEmails = pgTable(
  "idea_assessment_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaAssessmentId: uuid("idea_assessment_id")
      .notNull()
      .references(() => ideaAssessments.id, { onDelete: "cascade" }),
    kind: ideaEmailKind("kind").notNull(),
    status: ideaEmailStatus("status").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("idea_assessment_emails_assessment_idx").on(t.ideaAssessmentId),
    uniqueIndex("idea_assessment_emails_assessment_kind_uq").on(
      t.ideaAssessmentId,
      t.kind,
    ),
  ],
);

export const ideaAssessmentsRelations = relations(
  ideaAssessments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [ideaAssessments.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [ideaAssessments.organizationId],
      references: [organizations.id],
    }),
    result: one(ideaAssessmentResults, {
      fields: [ideaAssessments.id],
      references: [ideaAssessmentResults.ideaAssessmentId],
    }),
    emails: many(ideaAssessmentEmails),
  }),
);

export const ideaAssessmentResultsRelations = relations(
  ideaAssessmentResults,
  ({ one }) => ({
    assessment: one(ideaAssessments, {
      fields: [ideaAssessmentResults.ideaAssessmentId],
      references: [ideaAssessments.id],
    }),
  }),
);

export const ideaAssessmentEmailsRelations = relations(
  ideaAssessmentEmails,
  ({ one }) => ({
    assessment: one(ideaAssessments, {
      fields: [ideaAssessmentEmails.ideaAssessmentId],
      references: [ideaAssessments.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * Investor Room — interest capture (V1, "Investor Room" path).
 *
 * The public Level-1 presentation at /investor-room ends in a short
 * "Request Investor Access" form. Each submit writes one
 * `investor_interest_requests` row and auto-sends two emails (mirrors the idea
 * flow): a `confirmation` to the address entered and a `team_alert` to the
 * internal inbox. The gated data room (Level 2 — `approved` / `restricted` in
 * @/lib/security/investor-access) is still deferred to Phase 7.
 *
 * Free-text (`learn_more`) is stored + emailed only — NEVER sent to an LLM.
 * ------------------------------------------------------------------------- */

export const investorRole = pgEnum("investor_role", [
  "founder",
  "angel",
  "vc",
  "pe",
  "corporate",
  "family_office",
  "other",
]);

export const investorStage = pgEnum("investor_stage", [
  "pre_seed",
  "seed",
  "series_a_plus",
  "growth",
  "not_specified",
]);

export const investorGeography = pgEnum("investor_geography", [
  "india",
  "apac",
  "us",
  "europe",
  "global",
]);

export const investorRequestStatus = pgEnum("investor_request_status", [
  "new",
  "contacted",
  "approved",
  "declined",
]);

export const investorEmailKind = pgEnum("investor_email_kind", [
  "confirmation",
  "team_alert",
]);

export const investorEmailStatus = pgEnum("investor_email_status", [
  "sent",
  "failed",
]);

export const investorInterestRequests = pgTable(
  "investor_interest_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null — the page is public and does not require a Clerk session. No FK:
    // an interest request is a lead, not tenant data, and should outlive the
    // (optional) Clerk account that filed it.
    clerkUserId: text("clerk_user_id"),
    fullName: text("full_name").notNull(),
    workEmail: text("work_email").notNull(),
    company: text("company").notNull(),
    role: investorRole("role"),
    // string[] of investor_interest vocabulary values — validated in app code.
    interests: jsonb("interests").notNull().default([]),
    stage: investorStage("stage"),
    geography: investorGeography("geography"),
    learnMore: text("learn_more"),
    status: investorRequestStatus("status").notNull().default("new"),
    ...timestamps,
  },
  (t) => [
    index("investor_interest_requests_status_idx").on(t.status),
    index("investor_interest_requests_created_at_idx").on(t.createdAt),
  ],
);

/* Outbound investor-interest emails. `confirmation` auto-sends to the address
 * entered on the form (CLAUDE.md #7 exception); `team_alert` auto-sends to the
 * internal inbox. One row per (request, kind); no approval workflow. */
export const investorAccessEmails = pgTable(
  "investor_access_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => investorInterestRequests.id, { onDelete: "cascade" }),
    kind: investorEmailKind("kind").notNull(),
    status: investorEmailStatus("status").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("investor_access_emails_request_idx").on(t.requestId),
    uniqueIndex("investor_access_emails_request_kind_uq").on(
      t.requestId,
      t.kind,
    ),
  ],
);

export const investorInterestRequestsRelations = relations(
  investorInterestRequests,
  ({ many }) => ({
    emails: many(investorAccessEmails),
  }),
);

export const investorAccessEmailsRelations = relations(
  investorAccessEmails,
  ({ one }) => ({
    request: one(investorInterestRequests, {
      fields: [investorAccessEmails.requestId],
      references: [investorInterestRequests.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * Voice "Call Me" follow-up (Sarvam Voice Agents) — "Get a Call" path.
 *
 * The /ai-opportunities "Get a Call" CTA opens a short "Connect Me" form. On
 * submit we write one `voice_call_requests` row, auto-send a confirmation +
 * team-alert email (mirrors the investor flow), and fire an authenticated
 * webhook to the standalone FastAPI voice service, which places a Sarvam
 * outbound call. When the call ends Sarvam POSTs the transcript + status to the
 * voice service, which maps an outcome and calls back here — we update the same
 * row and send the team a call summary.
 *
 * The voice service is a STATELESS orchestrator; ALL persistence lives here
 * (see voiceplan.txt / docs/adr/0002). `requirement` + `transcript` are stored
 * + emailed and passed to Sarvam as agent variables — never sent to Groq.
 * ------------------------------------------------------------------------- */

export const voiceCallStatus = pgEnum("voice_call_status", [
  "pending",
  "calling",
  "completed",
  "failed",
]);

export const voiceCallOutcome = pgEnum("voice_call_outcome", [
  "interested",
  "consultation_requested",
  "callback_requested",
  "not_interested",
  "no_answer",
  "completed_unclear",
]);

export const voiceCallEmailKind = pgEnum("voice_call_email_kind", [
  "confirmation",
  "team_alert",
  "team_summary",
]);

export const voiceCallEmailStatus = pgEnum("voice_call_email_status", [
  "sent",
  "failed",
]);

export const voiceCallRequests = pgTable(
  "voice_call_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Idempotency key shared end-to-end (web -> service -> Sarvam metadata ->
    // service -> web). The result callback dedupes on this.
    requestId: uuid("request_id").notNull().unique().defaultRandom(),
    // Null — the CTA is public. No FK: a lead should outlive the optional
    // Clerk account that filed it.
    clerkUserId: text("clerk_user_id"),
    fullName: text("full_name").notNull(),
    company: text("company"),
    phoneE164: text("phone_e164").notNull(),
    email: text("email"),
    requirement: text("requirement").notNull(),
    consent: boolean("consent").notNull(),
    status: voiceCallStatus("status").notNull().default("pending"),
    outcome: voiceCallOutcome("outcome"),
    attemptId: text("attempt_id"),
    callStatus: text("call_status"),
    durationSeconds: integer("duration_seconds"),
    transcript: jsonb("transcript"),
    summary: text("summary"),
    error: text("error"),
    calledAt: timestamp("called_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("voice_call_requests_status_idx").on(t.status),
    index("voice_call_requests_created_at_idx").on(t.createdAt),
    uniqueIndex("voice_call_requests_request_id_uq").on(t.requestId),
  ],
);

export const voiceCallEmails = pgTable(
  "voice_call_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => voiceCallRequests.requestId, { onDelete: "cascade" }),
    kind: voiceCallEmailKind("kind").notNull(),
    status: voiceCallEmailStatus("status").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("voice_call_emails_request_idx").on(t.requestId),
    uniqueIndex("voice_call_emails_request_kind_uq").on(t.requestId, t.kind),
  ],
);

export const voiceCallRequestsRelations = relations(
  voiceCallRequests,
  ({ many }) => ({
    emails: many(voiceCallEmails),
  }),
);

export const voiceCallEmailsRelations = relations(
  voiceCallEmails,
  ({ one }) => ({
    request: one(voiceCallRequests, {
      fields: [voiceCallEmails.requestId],
      references: [voiceCallRequests.requestId],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * Audit log (Phase 0.5, CLAUDE.md #8) — append-only.
 *
 * No updated_at / deleted_at: rows are never modified or soft-deleted. Only a
 * retention job hard-deletes rows past their window (see data-classification.ts /
 * audit.ts retentionDays). No foreign keys — an audit row must outlive the actor
 * or resource it describes. `tenant` is an organization id, `personal:<userId>`,
 * or null for system-wide events. Allowed `type` values live in @/lib/security.
 * ------------------------------------------------------------------------- */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    tenant: text("tenant"),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_events_type_idx").on(t.type),
    index("audit_events_tenant_idx").on(t.tenant),
    index("audit_events_created_at_idx").on(t.createdAt),
  ],
);
