/**
 * Standalone validation for the v1 API contract (Phase 0.4).
 * Run with `npm run check:api-contract`. Exits non-zero on failure.
 */
import {
  apiErrorBodySchema,
  buildApiErrorBody,
  cursorPageParamsSchema,
  decodeCursor,
  encodeCursor,
  fingerprintBody,
  toCursorPage,
} from "../src/lib/api";
import {
  assessmentResultResponseSchema,
  expertReviewRequestSchema,
  submitAssessmentRequestSchema,
} from "../src/lib/api/contract/assessment";
import { ASSESSMENT_QUESTIONS } from "../src/lib/assessment/questions";
import { FACTORS } from "../src/lib/scoring/factors";

const errors: string[] = [];
const fail = (m: string) => errors.push(m);

// --- error envelope shape ---
const errBody = buildApiErrorBody("validation_error", "bad", {
  requestId: "req_1",
  details: [{ field: "answers.industry", message: "Required" }],
});
if (!apiErrorBodySchema.safeParse(errBody).success) {
  fail("buildApiErrorBody does not satisfy apiErrorBodySchema");
}
if (
  apiErrorBodySchema.safeParse({
    error: { code: "nope", message: "x", request_id: "r" },
  }).success
) {
  fail("apiErrorBodySchema accepted an unknown code");
}

// --- cursor pagination round-trip ---
const cur = encodeCursor({ createdAt: "2026-01-01T00:00:00Z", id: "abc" });
const back = decodeCursor<{ createdAt: string; id: string }>(cur);
if (!back || back.id !== "abc") fail("cursor round-trip failed");
if (decodeCursor("not-base64-json!") !== null)
  fail("bad cursor should decode to null");

const params = cursorPageParamsSchema.parse({ limit: "5" });
if (params.limit !== 5) fail("cursorPageParamsSchema did not coerce limit");
if (cursorPageParamsSchema.safeParse({ limit: 9999 }).success)
  fail("limit over max accepted");

const page = toCursorPage([{ id: "1" }, { id: "2" }, { id: "3" }], 2, (r) => ({
  id: r.id,
}));
if (page.items.length !== 2 || page.next_cursor === null)
  fail("toCursorPage did not paginate");
const lastPage = toCursorPage([{ id: "1" }], 2, (r) => ({ id: r.id }));
if (lastPage.next_cursor !== null)
  fail("toCursorPage set a cursor with no more rows");

// --- idempotency fingerprint is order-independent ---
if (fingerprintBody({ a: 1, b: 2 }) !== fingerprintBody({ b: 2, a: 1 })) {
  fail("fingerprintBody is not key-order independent");
}
if (fingerprintBody({ a: 1 }) === fingerprintBody({ a: 2 })) {
  fail("fingerprintBody collided on different bodies");
}

// --- submit request schema is derived from the questions ---
const validAnswers: Record<string, unknown> = {};
for (const q of ASSESSMENT_QUESTIONS) {
  if (q.type === "long_text")
    validAnswers[q.id] = "We spend 120 hours a week keying invoices.";
  else if (q.type === "short_text") validAnswers[q.id] = "~120 hrs/week";
  else if (q.type === "single_select")
    validAnswers[q.id] = q.options![0]!.value;
  else if (q.type === "multi_select")
    validAnswers[q.id] = [q.options![0]!.value];
}
const validContact = {
  companyName: "Acme Manufacturing",
  workEmail: "ops@acme.example",
};
const validSubmission = { answers: validAnswers, contact: validContact };

if (!submitAssessmentRequestSchema.safeParse(validSubmission).success) {
  fail("submitAssessmentRequestSchema rejected a well-formed submission");
}

// contact is required
if (
  submitAssessmentRequestSchema.safeParse({ answers: validAnswers }).success
) {
  fail("submit schema accepted a submission with no contact");
}
// contact email must be an email
if (
  submitAssessmentRequestSchema.safeParse({
    ...validSubmission,
    contact: { ...validContact, workEmail: "not-an-email" },
  }).success
) {
  fail("submit schema accepted a non-email work email");
}

// missing a required answer must fail
const requiredQ = ASSESSMENT_QUESTIONS.find((q) => q.required)!;
const missingRequired = { ...validAnswers };
delete missingRequired[requiredQ.id];
if (
  submitAssessmentRequestSchema.safeParse({
    ...validSubmission,
    answers: missingRequired,
  }).success
) {
  fail(
    `submit schema accepted a submission missing required "${requiredQ.id}"`,
  );
}

// unknown answer key must fail (strict)
if (
  submitAssessmentRequestSchema.safeParse({
    ...validSubmission,
    answers: { ...validAnswers, made_up_field: "x" },
  }).success
) {
  fail("submit schema accepted an unknown answer key");
}

// bad select value must fail
const selectQ = ASSESSMENT_QUESTIONS.find((q) => q.type === "single_select")!;
if (
  submitAssessmentRequestSchema.safeParse({
    ...validSubmission,
    answers: { ...validAnswers, [selectQ.id]: "not-an-option" },
  }).success
) {
  fail("submit schema accepted an invalid select value");
}

// --- result response schema ---
const sampleResult = {
  assessment_id: "00000000-0000-4000-8000-000000000000",
  problem_types: ["manual_document_processing"],
  industry: "manufacturing",
  lead_score: 83,
  score_band: "high",
  scoring_model_version: "1.0.0",
  breakdown: FACTORS.map((f) => ({
    id: f.id,
    label: f.label,
    weight: f.weight,
    level: "full",
    points: f.weight,
    rationale: "x",
  })),
  matches: [
    {
      capability_id: "intelligent-document-extraction",
      name: "Intelligent Document Extraction Pipeline",
      confidence: 0.88,
      match_class: "strong",
      rationale: null,
      rank: 1,
    },
  ],
  no_confident_match: false,
  summary: null,
};
const parsedResult = assessmentResultResponseSchema.safeParse(sampleResult);
if (!parsedResult.success) {
  fail(
    `assessmentResultResponseSchema rejected a valid result: ${parsedResult.error.message}`,
  );
}

// expert review note is optional but capped
if (!expertReviewRequestSchema.safeParse({}).success)
  fail("expert review should allow empty body");
if (expertReviewRequestSchema.safeParse({ note: "x".repeat(3000) }).success) {
  fail("expert review note over 2000 chars accepted");
}

if (errors.length > 0) {
  console.error("API contract checks FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK — error envelope, cursor pagination, idempotency fingerprint, and the ` +
    `assessment submit/result/expert-review schemas verified against ` +
    `${ASSESSMENT_QUESTIONS.length} questions.`,
);
