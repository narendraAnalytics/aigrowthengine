import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { upsertUser } from "@/server/sync/clerk-sync";

/**
 * Lazy-upsert safety net for the Clerk → Neon mirror.
 *
 * Called by POST /api/sync-user (triggered once per session by <SyncUser /> after
 * login) so the signed-in user always has a row, regardless of which page they
 * land on. Safe to call from any authenticated server route/page. Org + membership
 * rows are not synced yet.
 *
 * Returns the Clerk user (or null), so callers can use it directly.
 */
export async function syncCurrentUser() {
  const user = await currentUser();
  if (!user) return null;

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  try {
    await upsertUser({
      id: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
    });
  } catch (err) {
    // Never block the page on a sync hiccup — it retries on the next session.
    console.error("[syncCurrentUser] upsert failed:", err);
  }

  return user;
}
