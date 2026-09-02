import { currentUser } from "@clerk/nextjs/server";

import { submitCallRequestSchema } from "@/lib/voice";
import { createCallRequest } from "@/server/voice/create-call-request";

/**
 * POST /api/voice/call-request — capture a "Connect Me" submission from the
 * public /ai-opportunities "Get a Call" CTA and kick off the AI follow-up call.
 *
 * No session required; a Clerk user id is attached when one is present. The
 * response returns as soon as the row is written and the voice service has been
 * asked — the actual phone call happens asynchronously.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submitCallRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const user = await currentUser().catch(() => null);

  const { id, requestId } = await createCallRequest({
    data: parsed.data,
    userId: user?.id ?? null,
  });

  return Response.json({ ok: true, id, requestId }, { status: 201 });
}
