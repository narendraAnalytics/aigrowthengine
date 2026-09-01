import { currentUser } from "@clerk/nextjs/server";

import { ideaLeadContactSchema } from "@/lib/idea";
import {
  addIdeaContact,
  IdeaContactError,
} from "@/server/idea-assessment/add-idea-contact";

/**
 * POST /api/idea-assessments/:id/contact — attach lead contact details after
 * the founder has seen the result and clicked "talk to our team".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ideaLeadContactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    await addIdeaContact({
      ideaAssessmentId: id,
      userId: user.id,
      contact: parsed.data,
    });
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof IdeaContactError) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}
