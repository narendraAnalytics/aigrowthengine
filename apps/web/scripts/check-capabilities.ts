/**
 * Standalone validation for the Capability Library and assessment questions.
 * No test framework yet (roadmap 1.2) — run with `npm run check:capabilities`.
 * Exits non-zero on any problem so it can gate CI later.
 */
import { ASSESSMENT_QUESTIONS } from "../src/lib/assessment/questions";
import { CAPABILITIES, CAPABILITY_IDS } from "../src/lib/capabilities";
import { PROBLEM_TYPES } from "../src/lib/capabilities/schema";

const errors: string[] = [];

// Importing ../src/lib/capabilities already parses every record through the Zod
// schema and throws on duplicate ids. Here we add cross-record sanity checks.

if (CAPABILITIES.length < 10) {
  errors.push(`Expected >= 10 capabilities, found ${CAPABILITIES.length}`);
}

// Every problem_type (except the sentinel) should be covered by >= 1 capability.
const covered = new Set(CAPABILITIES.flatMap((c) => c.problemTypes));
for (const pt of PROBLEM_TYPES) {
  if (pt === "no_confident_match") continue;
  if (!covered.has(pt)) {
    errors.push(`problem_type "${pt}" is not covered by any capability`);
  }
}

// Assessment question ids must be unique and non-empty.
const qIds = new Set<string>();
for (const q of ASSESSMENT_QUESTIONS) {
  if (!q.id) errors.push("Assessment question with empty id");
  if (qIds.has(q.id)) errors.push(`Duplicate assessment question id: "${q.id}"`);
  qIds.add(q.id);
  if (
    (q.type === "single_select" || q.type === "multi_select") &&
    (!q.options || q.options.length === 0)
  ) {
    errors.push(`Question "${q.id}" is a select but has no options`);
  }
}

if (errors.length > 0) {
  console.error("Capability / assessment checks FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK — ${CAPABILITIES.length} capabilities (${CAPABILITY_IDS.size} unique ids), ` +
    `${ASSESSMENT_QUESTIONS.length} assessment questions.`,
);
