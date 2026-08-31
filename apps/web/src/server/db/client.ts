import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Single Drizzle client over Neon's HTTP driver (one round-trip per query — a good
 * fit for serverless route handlers and server components). Reuse across the app.
 *
 * Reads `DATABASE_URL` straight from the environment (not `@/env`) so this whole
 * `src/server/db` layer stays free of Next.js imports and ports cleanly to the
 * FastAPI service later. `src/env.ts` still validates the var at the app boundary.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const db = globalForDb.db ?? drizzle(neon(connectionString), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
