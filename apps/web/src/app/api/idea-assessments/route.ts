import { syncCurrentUser } from "@/lib/current-user";
import { submitIdeaRequestSchema } from "@/lib/idea";
import {
  IdeaAssessmentFailedError,
  runIdeaAssessment,
} from "@/server/idea-assessment/run-idea-assessment";

/**
 * POST /api/idea-assessments — submit AI idea answers, run the pipeline, return
 * the new id. Clerk-authenticated; the pipeline runs synchronously (~a few
 * seconds for the Groq call).
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

  const parsed = submitIdeaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await runIdeaAssessment({
      userId: user.id,
      answers: parsed.data.answers,
      contact: parsed.data.contact,
    });
    return Response.json(
      { id: result.ideaAssessmentId, status: result.status },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof IdeaAssessmentFailedError) {
      return Response.json(
        { error: "idea_assessment_failed", reason: error.reason },
        { status: 502 },
      );
    }
    throw error;
  }
}
