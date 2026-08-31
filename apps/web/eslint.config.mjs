import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/**
 * Flat config (ESLint 9). `next lint` was removed in Next.js 16 — run `eslint`
 * directly (see package.json `lint` script).
 *
 * - core-web-vitals: Next + React + react-hooks + jsx-a11y + import, with the
 *   CWV-affecting rules promoted to errors.
 * - typescript:      typescript-eslint recommended rules.
 * - prettier:        turns off every formatting rule so Prettier owns layout.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Mount-guard / reduced-motion patterns (e.g. next-themes' own recommended
      // `useEffect(() => setMounted(true), [])`) legitimately trip this. Keep it
      // visible as a warning; revisit individual sites when tightening.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "samplefolder/**",
    "public/sw.js",
    "public/sw.js.map",
    "public/swe-worker-*.js",
    "drizzle/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
