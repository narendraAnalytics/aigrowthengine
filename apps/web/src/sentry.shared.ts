import { env } from "@/env";

import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";

/**
 * Options shared by the browser, Node, and Edge Sentry inits. Each
 * instrumentation file adds its own runtime-specific bits.
 *
 * Sentry stays inert until NEXT_PUBLIC_SENTRY_DSN is set (Vercel env), so this
 * is safe to ship before the DSN exists.
 */
export const sentryDsn = env.NEXT_PUBLIC_SENTRY_DSN;

const environment =
  process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

/** Strip anything that could carry PII before an event leaves the process. */
const scrub: NonNullable<BrowserOptions["beforeSend"]> = (event) => {
  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
      delete event.request.headers["x-clerk-auth-token"];
    }
  }
  // We never opt into PII, but be explicit: drop email / ip if something set them.
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
  return event;
};

export const commonSentryOptions: NodeOptions & BrowserOptions = {
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  // Sample 10% of traces in prod; everything locally.
  tracesSampleRate: environment === "production" ? 0.1 : 1,
  sendDefaultPii: false,
  beforeSend: scrub,
};
