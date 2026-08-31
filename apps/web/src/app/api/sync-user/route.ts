import { syncCurrentUser } from "@/lib/current-user";

/**
 * Mirrors the signed-in Clerk user into Neon. Called once per session by the
 * client <SyncUser /> component right after authentication, so the user's row
 * exists no matter which page they land on — without making every page dynamic.
 *
 * Identity comes from the Clerk session (auth()/currentUser()), never the request
 * body, so there is nothing to spoof and no input to validate.
 *
 * No route segment config: under `cacheComponents` the Node.js runtime is the
 * default and route handlers are dynamic unless they opt into `use cache`.
 */
export async function POST() {
  const user = await syncCurrentUser();
  return Response.json({ synced: Boolean(user) }, { status: user ? 200 : 401 });
}
