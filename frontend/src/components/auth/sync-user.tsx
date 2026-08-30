"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Fires once per Clerk session, as soon as the user is authenticated, to mirror
 * their profile into Neon via POST /api/sync-user. Keeps the rest of the app
 * static — no page needs to become dynamic just to persist the user.
 *
 * Renders nothing. Mounted inside <ClerkProvider> in providers.tsx.
 */
export function SyncUser() {
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const syncedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId) return;
    if (syncedSession.current === sessionId) return;

    const storageKey = `user-synced:${sessionId}`;
    try {
      if (sessionStorage.getItem(storageKey)) {
        syncedSession.current = sessionId;
        return;
      }
    } catch {
      // sessionStorage unavailable — fall through and just sync.
    }

    syncedSession.current = sessionId;
    fetch("/api/sync-user", { method: "POST" })
      .then((res) => {
        if (res.ok) {
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        // Best effort; retried next session / on the next mount.
        syncedSession.current = null;
      });
  }, [isLoaded, isSignedIn, sessionId]);

  return null;
}
