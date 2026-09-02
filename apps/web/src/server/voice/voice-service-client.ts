import "server-only";

import { env } from "@/env";

/**
 * Thin client for the standalone FastAPI voice service (apps/api).
 *
 * The web app never talks to Sarvam directly — it hands the call request to the
 * voice service over an authenticated webhook and returns immediately. A
 * failure here is caught by the caller and recorded; it never fails the user's
 * form submission (Sarvam is out of the request path by design).
 */

export type DispatchCallInput = {
  requestId: string;
  phone: string;
  fullName: string;
  company: string | null;
  requirement: string;
};

export class VoiceServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "VoiceServiceError";
  }
}

export function voiceServiceConfigured(): boolean {
  return Boolean(env.VOICE_SERVICE_URL && env.VOICE_WEBHOOK_SECRET);
}

export async function dispatchVoiceCall(
  input: DispatchCallInput,
): Promise<{ attemptId: string | null }> {
  if (!env.VOICE_SERVICE_URL || !env.VOICE_WEBHOOK_SECRET) {
    throw new VoiceServiceError("voice service is not configured");
  }

  const url = `${env.VOICE_SERVICE_URL.replace(/\/$/, "")}/v1/voice/calls`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-voice-secret": env.VOICE_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        request_id: input.requestId,
        phone: input.phone,
        full_name: input.fullName,
        company: input.company,
        requirement: input.requirement,
      }),
      // The service places the Sarvam call synchronously-ish; keep a bound.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new VoiceServiceError(
      err instanceof Error ? err.message : "voice service unreachable",
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new VoiceServiceError(
      `voice service returned ${res.status}: ${text.slice(0, 1200)}`,
      res.status,
    );
  }

  const json = (await res.json().catch(() => ({}))) as {
    attempt_id?: string | null;
  };
  return { attemptId: json.attempt_id ?? null };
}
