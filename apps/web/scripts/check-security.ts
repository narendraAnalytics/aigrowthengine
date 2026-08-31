/**
 * Standalone validation for the security model (Phase 0.5).
 * Run with `npm run check:security`. Exits non-zero on failure.
 */
import {
  AUDIT_EVENTS,
  FIELD_CLASSIFICATION,
  INVESTOR_ACCESS_LEVELS,
  PERMISSIONS,
  RETENTION_DAYS,
  ROLE_PERMISSIONS,
  THREATS,
  THREAT_COMPONENTS,
  USER_ROLES,
  can,
  classifyField,
  isKnownPermission,
  matchesScope,
  meetsInvestorAccess,
  orgScope,
  personalScope,
} from "../src/lib/security";
import { auditEventSchema, isKnownAuditEvent } from "../src/lib/security/audit";
import { STRIDE } from "../src/lib/security/threat-model";

const errors: string[] = [];
const fail = (m: string) => errors.push(m);

// --- RBAC ---
for (const role of USER_ROLES) {
  if (!ROLE_PERMISSIONS[role]) fail(`role "${role}" has no permission set`);
  for (const p of ROLE_PERMISSIONS[role]) {
    if (!isKnownPermission(p))
      fail(`role "${role}" references unknown permission "${p}"`);
  }
}
if (ROLE_PERMISSIONS.admin.size !== PERMISSIONS.length) {
  fail(
    `admin should hold all ${PERMISSIONS.length} permissions, has ${ROLE_PERMISSIONS.admin.size}`,
  );
}
if (!can("prospect", "assessment:create"))
  fail("prospect must be able to create an assessment");
if (can("prospect", "crm:read")) fail("prospect must NOT read CRM");
if (!can("security", "audit:read")) fail("security must read the audit log");
if (can("investor", "assessment:read:any"))
  fail("investor must not read assessments");

// --- tenant scoping ---
const org = orgScope("org_1");
const personal = personalScope("user_1");
if (!matchesScope({ organizationId: "org_1" }, org))
  fail("org scope should match its org row");
if (matchesScope({ organizationId: "org_2" }, org))
  fail("org scope leaked across orgs");
if (!matchesScope({ organizationId: null, userId: "user_1" }, personal)) {
  fail("personal scope should match the user's personal row");
}
if (matchesScope({ organizationId: "org_1", userId: "user_1" }, personal)) {
  fail("personal scope must not match an org-attached row");
}
try {
  orgScope("");
  fail("orgScope('') should throw");
} catch {
  /* expected */
}

// --- investor access ordering ---
for (let i = 0; i < INVESTOR_ACCESS_LEVELS.length; i++) {
  for (let j = 0; j < INVESTOR_ACCESS_LEVELS.length; j++) {
    const expected = i >= j;
    if (
      meetsInvestorAccess(
        INVESTOR_ACCESS_LEVELS[i]!,
        INVESTOR_ACCESS_LEVELS[j]!,
      ) !== expected
    ) {
      fail(
        `meetsInvestorAccess(${INVESTOR_ACCESS_LEVELS[i]}, ${INVESTOR_ACCESS_LEVELS[j]}) wrong`,
      );
    }
  }
}

// --- data classification covers the assessment domain ---
const requiredFields = [
  "users.email",
  "assessments.answers",
  "assessment_results.signals",
  "capability_matches.rationale",
  "expert_review_requests.note",
  "audit_events.metadata",
];
for (const f of requiredFields) {
  if (!classifyField(f)) fail(`field "${f}" is not classified`);
}
for (const [field, cls] of Object.entries(FIELD_CLASSIFICATION)) {
  if (!(cls in RETENTION_DAYS))
    fail(`field "${field}" has unknown class "${cls}"`);
}

// --- audit catalogue ---
const auditTypes = new Set<string>();
for (const e of AUDIT_EVENTS) {
  if (auditTypes.has(e.type)) fail(`duplicate audit event type "${e.type}"`);
  auditTypes.add(e.type);
  if (e.retentionDays <= 0)
    fail(`audit event "${e.type}" has non-positive retention`);
}
if (!isKnownAuditEvent("assessment.submitted"))
  fail("expected assessment.submitted in catalogue");
const sampleEvent = auditEventSchema.safeParse({
  type: "assessment.submitted",
  actorId: "user_1",
  actorRole: "prospect",
  tenant: "personal:user_1",
  resourceType: "assessment",
  resourceId: "00000000-0000-4000-8000-000000000000",
  requestId: "req_1",
  at: new Date(),
  metadata: {},
});
if (!sampleEvent.success)
  fail(`auditEventSchema rejected a valid event: ${sampleEvent.error.message}`);
if (
  auditEventSchema.safeParse({
    type: "made.up",
    actorId: null,
    actorRole: null,
    tenant: null,
    resourceType: "x",
    resourceId: null,
    requestId: null,
    at: new Date(),
  }).success
) {
  fail("auditEventSchema accepted an unknown event type");
}

// --- threat model coverage ---
for (const component of THREAT_COMPONENTS) {
  const ts = THREATS.filter((t) => t.component === component);
  if (ts.length === 0) fail(`threat model has no entries for "${component}"`);
  for (const t of ts) {
    if (!STRIDE.includes(t.stride))
      fail(`threat in "${component}" has bad STRIDE "${t.stride}"`);
    if (!t.mitigation || t.mitigation.length < 20) {
      fail(`threat "${t.threat.slice(0, 40)}..." has no real mitigation`);
    }
  }
}

if (errors.length > 0) {
  console.error("Security model checks FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK — ${USER_ROLES.length} roles / ${PERMISSIONS.length} permissions, ` +
    `${INVESTOR_ACCESS_LEVELS.length} investor levels, ${AUDIT_EVENTS.length} audit event types, ` +
    `${THREATS.length} threats across ${THREAT_COMPONENTS.length} components.`,
);
