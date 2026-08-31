import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Central env validation. Missing/invalid vars fail the build (this module is
 * imported from next.config.ts, so validation runs before bundling).
 *
 * Add new vars here — never scatter raw `process.env` reads through the app.
 * Exception: `src/server/db/client.ts` reads `process.env.DATABASE_URL`
 * directly on purpose (that layer stays Next-free so it can port to FastAPI).
 */
export const env = createEnv({
  server: {
    /** Neon Postgres — pooled connection string (…-pooler.neon.tech). */
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    /** FastAPI service base URL (Phase 1.5). */
    API_BASE_URL: z.string().url().optional(),
    /** Sentry source-map upload — CI only (Phase 1.7). */
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    /** Public site URL — set once a custom domain exists; falls back to the
     *  Vercel deployment URL (see src/lib/site.ts). */
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    /** PostHog (Phase 2 / Track 3). */
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .url()
      .default("https://us.i.posthog.com"),
  },
  /** Next.js inlines NEXT_PUBLIC_* at build time — list each one explicitly. */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  /**
   * Skip validation for tooling that has no env (lint, the check:* spec
   * scripts, CI typecheck). A real `next build` never skips.
   */
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
  emptyStringAsUndefined: true,
});
