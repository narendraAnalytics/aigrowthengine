/**
 * Standalone validation for the analytics spec + MVP success criteria
 * (Phase 0.6 + 0.7). Run with `npm run check:analytics`. Exits non-zero on failure.
 */
import {
  ANALYTICS_EVENTS,
  BASE_PROPERTIES,
  EVENT_NAME_PATTERN,
  EVENT_OWNERS,
  FUNNEL_STAGES,
  PROPERTY_TYPES,
  STAGE_EVENT,
  SUCCESS_CRITERIA,
  evaluateCriterion,
  funnelTransitions,
  isKnownEvent,
} from "../src/lib/analytics";
import { AUDIT_EVENT_TYPES } from "../src/lib/security/audit";

const errors: string[] = [];
const fail = (m: string) => errors.push(m);

// --- event catalogue ---
const names = new Set<string>();
for (const e of ANALYTICS_EVENTS) {
  if (!EVENT_NAME_PATTERN.test(e.name)) fail(`event "${e.name}" is not snake_case`);
  if (names.has(e.name)) fail(`duplicate event name "${e.name}"`);
  names.add(e.name);
  if (!EVENT_OWNERS.includes(e.owner)) fail(`event "${e.name}" has bad owner "${e.owner}"`);
  if (!e.description || !e.firesWhen) fail(`event "${e.name}" missing description / firesWhen`);
  for (const [prop, type] of Object.entries(e.properties)) {
    if (!EVENT_NAME_PATTERN.test(prop)) fail(`event "${e.name}" property "${prop}" not snake_case`);
    if (!PROPERTY_TYPES.includes(type)) fail(`event "${e.name}" property "${prop}" bad type "${type}"`);
    if (prop in BASE_PROPERTIES) fail(`event "${e.name}" redeclares base property "${prop}"`);
  }
}

// --- funnel: every stage mapped to exactly one event ---
for (const stage of FUNNEL_STAGES) {
  const mapped = ANALYTICS_EVENTS.filter((e) => e.funnelStage === stage);
  if (mapped.length === 0) fail(`funnel stage "${stage}" has no event`);
  if (mapped.length > 1) {
    fail(`funnel stage "${stage}" is claimed by ${mapped.length} events: ${mapped.map((e) => e.name).join(", ")}`);
  }
  if (!isKnownEvent(STAGE_EVENT[stage])) fail(`STAGE_EVENT["${stage}"] points at an unknown event`);
}
// any funnelStage referenced by an event must be a real stage
for (const e of ANALYTICS_EVENTS) {
  if (e.funnelStage && !FUNNEL_STAGES.includes(e.funnelStage as (typeof FUNNEL_STAGES)[number])) {
    fail(`event "${e.name}" references unknown funnel stage "${e.funnelStage}"`);
  }
}
if (funnelTransitions().length !== FUNNEL_STAGES.length - 1) fail("funnelTransitions() wrong length");

// --- success criteria ---
const critIds = new Set<string>();
const knownRefs = new Set<string>([...ANALYTICS_EVENTS.map((e) => e.name), ...AUDIT_EVENT_TYPES]);
for (const c of SUCCESS_CRITERIA) {
  if (critIds.has(c.id)) fail(`duplicate success criterion "${c.id}"`);
  critIds.add(c.id);
  if (c.unit === "ratio" && (c.target < 0 || c.target > 1)) fail(`criterion "${c.id}" ratio target out of [0,1]`);
  if (c.unit === "percent" && (c.target < 0 || c.target > 100)) fail(`criterion "${c.id}" percent target out of [0,100]`);
  if (c.unit === "count" && c.target < 0) fail(`criterion "${c.id}" negative count target`);
  if (!c.measurement || c.measurement.length < 15) fail(`criterion "${c.id}" has no real measurement`);
  // measurement should name at least one known event or audit type, unless it's
  // an explicitly review-based security metric.
  const mentionsKnown = [...knownRefs].some((ref) => c.measurement.includes(ref));
  const reviewBased = /security review|confirmed|analysis/i.test(c.measurement);
  if (!mentionsKnown && !reviewBased) {
    fail(`criterion "${c.id}" measurement references no known event/audit type`);
  }
}

// sanity on the evaluator
if (!evaluateCriterion(SUCCESS_CRITERIA[0]!, 0.6).pass) fail("evaluateCriterion gte should pass at 0.6 vs 0.5");
const zero = SUCCESS_CRITERIA.find((c) => c.comparator === "eq")!;
if (evaluateCriterion(zero, 1).pass) fail("evaluateCriterion eq(0) should fail at 1");

// the four FinalRoadMap funnel conversion targets must all be present
for (const id of ["assessment_completion", "assessment_to_qualified", "qualified_to_consultation", "consultation_to_pilot"]) {
  if (!critIds.has(id)) fail(`missing FinalRoadMap §8 criterion "${id}"`);
}

if (errors.length > 0) {
  console.error("Analytics / success-criteria checks FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK — ${ANALYTICS_EVENTS.length} events, ${FUNNEL_STAGES.length}-stage funnel fully mapped, ` +
    `${SUCCESS_CRITERIA.length} MVP success criteria each with a measurement.`,
);
