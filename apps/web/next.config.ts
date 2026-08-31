import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import bundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";
import createJiti from "jiti";

import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));

// Validate env vars before the build starts — a missing/invalid var fails the
// build here rather than erroring at runtime. jiti lets us import the TS module
// from this config. See src/env.ts.
createJiti(fileURLToPath(import.meta.url))("./src/env");

const isDev = process.env.NODE_ENV === "development";

// --- Content Security Policy -------------------------------------------------
// Shipped in Report-Only mode: violations log to the browser console but nothing
// is blocked. Flip CSP_ENFORCE to true — and re-test the Clerk sign-up modal +
// PostHog on a preview deploy — to enforce. A nonce / strict-dynamic upgrade for
// the dynamic app surface (assessment, /admin) is tracked in roadmap Track 1;
// nonces force every route dynamic, so they don't belong on the static site.
const CSP_ENFORCE = false;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com",
  "font-src 'self'",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.posthog.com https://*.i.posthog.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: CSP_ENFORCE
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  typedRoutes: true,
  // Monorepo: pin the file-tracing root so builds stop guessing from the two
  // lockfiles (root tooling + apps/web).
  outputFileTracingRoot: join(here, "..", ".."),
  // Serwist adds a webpack config; an empty turbopack config silences Next 16's
  // "webpack config with no turbopack config" error during `next dev` (Turbopack).
  // The SW is disabled in dev anyway; `next build --webpack` uses the real config.
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Cloudflare R2 public bucket host — set R2_PUBLIC_HOST once it exists
      // (Phase 6). Inert until then.
      ...(process.env.R2_PUBLIC_HOST
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_PUBLIC_HOST,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
  cacheOnNavigation: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [{ url: "/~offline", revision: "1" }],
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Wrap order (innermost first): Serwist, then bundle analyzer. withSentryConfig
// goes outermost when Sentry is wired in Phase 1.7.
export default withBundleAnalyzer(withSerwist(nextConfig));
