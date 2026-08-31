"use client";

import { useUser } from "@clerk/nextjs";

/** Best-effort display name: username → first name → email local-part. */
export function useDisplayName() {
  const { user } = useUser();
  return (
    user?.username ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "there"
  );
}

export function WelcomeName({ className }: { className?: string }) {
  const name = useDisplayName();
  return <span className={className}>Welcome, {name}</span>;
}
