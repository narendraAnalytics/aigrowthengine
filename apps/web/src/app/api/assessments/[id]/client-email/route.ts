import { syncCurrentUser } from "@/lib/current-user";
import {
  approveAndSendClientEmail,
  ClientEmailApprovalError,
} from "@/server/email/assessment-emails";
import { currentUserEmail, isStaffEmail } from "@/server/staff";

/**
 * POST /api/assessments/:id/client-email — a staff member approves and sends the
 * drafted client result email (CLAUDE.md #7: recorded human approval before an
 * outbound artifact). Gated by the STAFF_EMAILS allowlist until Clerk roles land.
 */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await syncCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = await currentUserEmail();
  if (!isStaffEmail(email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    const result = await approveAndSendClientEmail({
      assessmentId: id,
      approverEmail: email!,
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ClientEmailApprovalError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
