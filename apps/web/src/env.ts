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
    /** Groq LLM — assessment signal generation (Phase 3, ADR 0001). Required
     *  once the assessment pipeline ships. */
    GROQ_API_KEY: z.string().min(1),
    GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
    /** Model for the compact "how we'd solve this" narrative call (Phase 3).
     *  Kept separate so it can be a cheaper/faster model than the assessment. */
    GROQ_NARRATIVE_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
    /** Resend — assessment notification + client result emails (Phase 3). */
    RESEND_API_KEY: z.string().min(1),
    /** RFC-5322 from address, e.g. `AIGROWTHENGINE <admin@buildflows.shop>`. */
    RESEND_FROM: z
      .string()
      .min(1)
      .default("AIGROWTHENGINE <admin@buildflows.shop>"),
    /** Internal inbox that receives the lead-alert email for every assessment. */
    ASSESSMENT_TEAM_EMAIL: z.string().email(),
    /** Comma-separated emails allowed to approve + send client result emails.
     *  Bridge until Clerk roles/orgs land (CLAUDE.md deferred). */
    STAFF_EMAILS: z.string().default(""),
    /** Sentry source-map upload + release tagging — CI only. */
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    /** Cloudflare R2 public bucket host for next/image (Phase 6). */
    R2_PUBLIC_HOST: z.string().min(1).optional(),
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
    /** Sentry DSN (public — safe to expose). SDK no-ops when unset. */
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },
  /** Next.js inlines NEXT_PUBLIC_* at build time — list each one explicitly. */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
