import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

/**
 * Resend client + a thin send wrapper (Phase 3).
 *
 * Resend returns `{ data, error }` rather than throwing. This wrapper normalises
 * that: it returns the provider message id on success and throws `EmailSendError`
 * on failure, with one retry on a 429 (rate limit) after a short backoff. The
 * free tier is ~10 req/s per team — well clear of our volume — but the retry
 * keeps a burst from dropping a lead alert.
 */

let client: Resend | undefined;

function getClient(): Resend {
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    public readonly providerError?: unknown,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ id: string }> {
  const from = env.RESEND_FROM || "AIGROWTHENGINE <admin@buildflows.shop>";

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await getClient().emails.send({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (!error && data?.id) return { id: data.id };

    const name = (error as { name?: string } | null)?.name ?? "";
    const isRateLimit =
      name === "rate_limit_exceeded" || name === "too_many_requests";
    if (isRateLimit && attempt === 0) {
      await sleep(1200);
      continue;
    }
    throw new EmailSendError(
      (error as { message?: string } | null)?.message ?? "email send failed",
      error,
    );
  }
  throw new EmailSendError("email send failed after retry");
}
