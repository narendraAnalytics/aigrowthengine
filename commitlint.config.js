/**
 * Conventional Commits enforcement.
 * https://www.conventionalcommits.org/
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      1,
      "always",
      ["web", "api", "packages", "infra", "ci", "deps", "repo", "docs", "security", "ai"],
    ],
    "body-max-line-length": [0, "always"],
  },
};
