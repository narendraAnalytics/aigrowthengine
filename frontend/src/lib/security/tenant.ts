/**
 * Tenant isolation (Phase 0.5, CLAUDE.md #3).
 *
 * Every read/write of tenant-scoped data MUST go through a `TenantScope`. There
 * is no "unscoped" query path for tenant data — the repository layer takes a
 * scope and builds the mandatory filter with `tenantFilter()`.
 *
 * Two scope kinds:
 *  - `org`      — the actor is operating inside a Clerk organization. Filter is
 *                 `organization_id = :organizationId`.
 *  - `personal` — a prospect with no Clerk org yet. Their assessments are
 *                 personal: filter is `user_id = :userId AND organization_id IS NULL`.
 *
 * `assessments.organization_id` is nullable BY DESIGN for the personal case. When
 * a prospect later joins/creates an org, a deliberate migration step (not an ad
 * hoc update) attaches their personal assessments to that org.
 *
 * Internal staff (sales/engineer/…) reading across tenants use an explicit
 * `assessment:read:any`-style permission (see rbac.ts) and a separate cross-tenant
 * repository method that records an audit event — never by passing a fake scope.
 */

export type TenantScope =
  | { kind: "org"; organizationId: string }
  | { kind: "personal"; userId: string };

export function orgScope(organizationId: string): TenantScope {
  if (!organizationId) throw new Error("orgScope requires an organizationId");
  return { kind: "org", organizationId };
}

export function personalScope(userId: string): TenantScope {
  if (!userId) throw new Error("personalScope requires a userId");
  return { kind: "personal", userId };
}

/** Column names a tenant-scoped table is expected to expose. */
export type TenantColumns = {
  organizationId: string | null;
  userId?: string | null;
};

/**
 * Predicate form of the tenant filter — for in-memory checks and tests. The DB
 * repository builds the equivalent SQL `WHERE` from the same scope.
 */
export function matchesScope(row: TenantColumns, scope: TenantScope): boolean {
  if (scope.kind === "org") {
    return row.organizationId === scope.organizationId;
  }
  return row.organizationId == null && row.userId === scope.userId;
}

/**
 * Describe the mandatory filter for logging / assertions. The repo layer
 * translates this into Drizzle `and(eq(...), ...)`.
 */
export function describeTenantFilter(scope: TenantScope): string {
  return scope.kind === "org"
    ? `organization_id = '${scope.organizationId}'`
    : `user_id = '${scope.userId}' AND organization_id IS NULL`;
}
