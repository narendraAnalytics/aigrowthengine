import { currentUser } from "@clerk/nextjs/server";

import { submitInvestorInterestSchema } from "@/lib/investor";
import { createInvestorRequest } from "@/server/investor-access/create-request";

/**
 * POST /api/investor-access — capture a "Request Investor Access" submission
 * from the public Investor Room. No session required; a Clerk user id is
 * attached when one is present.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submitInvestorInterestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const user = await currentUser().catch(() => null);

  const { id } = await createInvestorRequest({
    data: parsed.data,
    userId: user?.id ?? null,
    requestId: request.headers.get("x-request-id"),
  });

  return Response.json({ ok: true, id }, { status: 201 });
}
