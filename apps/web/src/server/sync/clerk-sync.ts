import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

/**
 * Pure persistence for the Clerk → Neon user mirror. Callers pass plain data;
 * nothing here knows about HTTP, Next.js or Clerk SDK types.
 *
 * Sync is lazy: the client <SyncUser /> component POSTs /api/sync-user once per
 * session after login, which calls `syncCurrentUser()` → `upsertUser`. Writes are
 * idempotent upserts so repeat calls are no-ops. Organizations/memberships are
 * not synced yet — the tables exist but stay empty until a tenant-scoped feature
 * needs them.
 *
 * This layer will be ported to the FastAPI `apps/api` service later; keep it
 * framework-agnostic.
 */

export type UserInput = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export async function upsertUser(input: UserInput) {
  await db
    .insert(users)
    .values({
      id: input.id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      imageUrl: input.imageUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
        updatedAt: new Date(),
      },
    });
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}
