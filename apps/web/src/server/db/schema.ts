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
