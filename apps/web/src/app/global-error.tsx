"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches errors in the root layout itself (segment error.tsx boundaries handle
 * everything below). Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#1f1220",
          color: "#f2e4cd",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "1.5rem" }}>
            The error has been logged. Please try again.
          </p>
          {/* Plain <a>: global-error renders outside the router when the app
              tree itself failed, so next/link can't be relied on here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              color: "#e3a83f",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
