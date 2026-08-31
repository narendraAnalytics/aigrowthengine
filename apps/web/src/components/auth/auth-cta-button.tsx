"use client";

import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

import type { ReactNode } from "react";

/**
 * A call-to-action that opens the Clerk sign-up modal for signed-out
 * visitors (new users get the username form) and, once signed in, becomes
 * a normal link. Auth always returns the user to the landing page — the
 * redirect URLs are pinned on <ClerkProvider>.
 */
export function AuthCtaButton({
  children,
  signedInChildren,
  className,
  signedInHref,
}: {
  children: ReactNode;
  /** Label shown once signed in; defaults to `children`. */
  signedInChildren?: ReactNode;
  className: string;
  signedInHref: string;
}) {
  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className={className}>
            {children}
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href={signedInHref} className={className}>
          {signedInChildren ?? children}
        </Link>
      </Show>
    </>
  );
}
