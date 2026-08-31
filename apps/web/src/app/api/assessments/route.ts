import { submitAssessmentRequestSchema } from "@/lib/api/contract/assessment";
import { syncCurrentUser } from "@/lib/current-user";
import {
  AssessmentFailedError,
  runAssessment,
} from "@/server/assessment/run-assessment";

/**
 * POST /api/assessments — submit assessment answers, run the pipeline, return
 * the new assessment id (Slice A — STEP 4). Clerk-authenticated; the pipeline
 * runs synchronously (~a few seconds for the Groq call — no background job /
 * SSE in the slice).
 *
 * No route segment config: under `cacheComponents` the Node runtime is the
 * default and route handlers are dynamic unless they opt into `use cache`.
 */
export async function POST(request: Request) {
  const user = await syncCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submitAssessmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await runAssessment({
      userId: user.id,
      answers: parsed.data.answers,
      contact: parsed.data.contact,
    });
    return Response.json(
      { id: result.assessmentId, status: result.status },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AssessmentFailedError) {
      return Response.json(
        { error: "assessment_failed", reason: error.reason },
        { status: 502 },
      );
    }
    throw error;
  }
}
