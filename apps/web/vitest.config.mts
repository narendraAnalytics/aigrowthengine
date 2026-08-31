import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Unit-test runner for Slice A (Phase 3). Node environment only — the slice
 * tests pure logic (`src/lib/matching`, the assessment schema, the pipeline
 * core) and never opens a network or DB connection. Component/DOM testing lands
 * with the wider test track later.
 */
const src = fileURLToPath(new URL("./src", import.meta.url));
const empty = fileURLToPath(new URL("./src/test/empty.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "server-only": empty,
      "client-only": empty,
      // Not under test here; importing the real SDK adds ~40s to cold start.
      "@sentry/nextjs": fileURLToPath(
        new URL("./src/test/sentry-stub.ts", import.meta.url),
      ),
      "@": src,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
