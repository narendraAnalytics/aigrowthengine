import { fileURLToPath } from "node:url";

import withSerwistInit from "@serwist/next";
import createJiti from "jiti";

import type { NextConfig } from "next";

// Validate env vars before the build starts — a missing/invalid var fails the
// build here rather than erroring at runtime. jiti lets us import the TS module
// from this config. See src/env.ts.
createJiti(fileURLToPath(import.meta.url))("./src/env");

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Serwist adds a webpack config; an empty turbopack config silences Next 16's
  // "webpack config with no turbopack config" error during `next dev` (Turbopack).
  // The SW is disabled in dev anyway; `next build --webpack` uses the real config.
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
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

export default withSerwist(nextConfig);
