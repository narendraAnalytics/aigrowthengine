import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Central env validation. Missing/invalid vars fail the build.
 * Add new vars here, not scattered `process.env` reads.
 */
export const env = createEnv({
  server: {
    // Neon Postgres — pooled connection string (…-pooler.neon.tech).
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  // Next.js inlines `NEXT_PUBLIC_*` at build time, so they must be listed explicitly.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // Let the landing-page deploy build before the DB integration is configured.
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
  emptyStringAsUndefined: true,
});
