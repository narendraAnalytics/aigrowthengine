import { defineConfig } from "drizzle-kit";

// drizzle-kit reads the env directly (it runs outside Next), so load .env here.
// Keep it a plain process.env read — src/env.ts pulls in Next-only modules.
export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
