import { expertReviewRequestSchema } from "@/lib/api/contract/assessment";
import { syncCurrentUser } from "@/lib/current-user";
import {
  ExpertReviewError,
  requestExpertReview,
} from "@/server/assessment/request-expert-review";

/**
 * POST /api/assessments/:id/expert-review — the "Request expert review" action
 * on a low-confidence result (Slice A — STEP 5). Writes one
 * `expert_review_requests` row and flips the assessment to
 * `needs_expert_review`. Idempotent per (assessment, user).
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await syncCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is fine — `note` is optional.
  }

  const parsed = expertReviewRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await requestExpertReview({
      assessmentId: id,
      userId: user.id,
      note: parsed.data.note,
    });
    return Response.json(
      { id: result.id, assessment_id: id, status: "open" },
      { status: result.alreadyRequested ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof ExpertReviewError) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}
