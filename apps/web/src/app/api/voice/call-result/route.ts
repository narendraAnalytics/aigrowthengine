import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { env } from "@/env";
import { recordCallResult } from "@/server/voice/record-call-result";

/**
 * POST /api/voice/call-result — the FastAPI voice service posts the outcome
 * here after a Sarvam call ends. Authenticated with the shared
 * `VOICE_WEBHOOK_SECRET` (constant-time compare). Idempotent downstream.
 */

const bodySchema = z.object({
  request_id: z.string().uuid(),
  outcome: z.string().min(1),
  call_status: z.string().nullish(),
  duration_seconds: z.number().int().nonnegative().nullish(),
  summary: z.string().nullish(),
  transcript: z
    .array(z.object({ role: z.string(), text: z.string() }))
    .nullish(),
});

function secretOk(header: string | null): boolean {
  if (!header || !env.VOICE_WEBHOOK_SECRET) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(env.VOICE_WEBHOOK_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretOk(request.headers.get("x-voice-secret"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const result = await recordCallResult({
    requestId: parsed.data.request_id,
    outcome: parsed.data.outcome,
    callStatus: parsed.data.call_status ?? null,
    durationSeconds: parsed.data.duration_seconds ?? null,
    transcript: parsed.data.transcript ?? null,
    summary: parsed.data.summary ?? null,
  });

  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 404 });
  }
  return Response.json({ ok: true, deduped: result.deduped }, { status: 200 });
}
