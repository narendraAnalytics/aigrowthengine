// Minimal `@sentry/nextjs` stand-in for the Vitest node environment.
export function addBreadcrumb(_breadcrumb?: unknown): void {}
export function captureException(_error?: unknown): string {
  return "";
}
