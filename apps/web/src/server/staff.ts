import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { env } from "@/env";

/**
 * Staff all/list bridge until Clerk roles/organizations land (CLAUDE.md defers
 * sign-in routes + Organizations). `STAFF_EMAILS` is a comma-separated allowlist
 * of internal addresses permitted to approve + send client result emails
 * (RBAC permission `assessment:email:approve`).
 */
function staffEmails(): string[] {
  return (env.STAFF_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return staffEmails().includes(email.toLowerCase());
}

/** The signed-in user's primary email, or null. */
export async function currentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  return (
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}
