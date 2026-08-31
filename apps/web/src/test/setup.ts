/**
 * Vitest global setup for the Slice A unit tests. Provides the env vars that
 * modules validate at import time so server modules (db client, `@/env`) load
 * without a real `.env`. No test here opens a network/DB connection — the Groq
 * SDK and Drizzle client are mocked or unused.
 */
process.env.SKIP_ENV_VALIDATION ||= "1";
process.env.DATABASE_URL ||= "postgres://test:test@localhost:5432/test";
process.env.GROQ_API_KEY ||= "test-key";
