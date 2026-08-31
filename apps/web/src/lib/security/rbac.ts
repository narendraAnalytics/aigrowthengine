/**
 * Role-Based Access Control (Phase 0.5).
 *
 * The role × permission matrix is the single source of truth for "who can do
 * what". Authorization is checked CLOSE TO THE RESOURCE (CLAUDE.md #4) using
 * `can()` / `assertCan()`, not only in proxy.ts.
 *
 * A user's role is derived from Clerk (org role claim + app metadata) by the
 * caller; this module is pure and knows nothing about Clerk.
 */

/** Locked in PRD 0.1. */
export const USER_ROLES = [
  "prospect", // signed up, running assessments, not yet a client
  "client", // paying client, sees their org's data + portal
  "investor", // investor-room access (graded separately, see investor-access.ts)
  "sales", // internal: CRM, consultations, proposals
  "engineer", // internal: delivery, capability library
  "security", // internal: audit log, threat model, security reviews
  "management", // internal: full business visibility
  "admin", // internal: user/role administration, everything
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Permission catalogue. Format `resource:action[:scope]`.
 * `:own`   = only rows owned by the acting user
 * `:org`   = any row within the acting user's tenant (see tenant.ts)
 * no scope = global / internal resource
 */
export const PERMISSIONS = [
  "assessment:create",
  "assessment:read:own",
  "assessment:read:org",
  "assessment:read:any",
  "expert_review:create",
  "expert_review:read:org",
  "expert_review:manage", // internal: triage / contact / close

  "capability:read",
  "capability:write", // author / edit the Capability Library

  "crm:read",
  "crm:write",
  "score:override", // manual lead-score override (with mandatory reason)

  "investor_room:read",
  "investor_room:manage", // grant / revoke access, upload materials

  "audit:read",
  "security:manage", // threat model, security reviews

  "user:read",
  "user:manage", // assign roles, deactivate

  "org:read",
  "org:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET = new Set<string>(PERMISSIONS);
export function isKnownPermission(p: string): p is Permission {
  return PERMISSION_SET.has(p);
}

const NONE: Permission[] = [];

/** Every role's permission set. `admin` is expanded to all permissions below. */
const BASE_MATRIX: Record<UserRole, Permission[]> = {
  prospect: ["assessment:create", "assessment:read:own", "expert_review:create", "capability:read"],
  client: [
    "assessment:create",
    "assessment:read:own",
    "assessment:read:org",
    "expert_review:create",
    "expert_review:read:org",
    "capability:read",
    "org:read",
  ],
  investor: ["investor_room:read"],
  sales: [
    "assessment:read:any",
    "expert_review:read:org",
    "expert_review:manage",
    "capability:read",
    "crm:read",
    "crm:write",
    "score:override",
  ],
  engineer: ["assessment:read:any", "capability:read", "capability:write", "crm:read"],
  security: ["audit:read", "security:manage", "capability:read", "assessment:read:any"],
  management: [
    "assessment:read:any",
    "expert_review:read:org",
    "capability:read",
    "crm:read",
    "investor_room:read",
    "investor_room:manage",
    "audit:read",
    "user:read",
    "org:read",
  ],
  admin: NONE, // filled below
};

export const ROLE_PERMISSIONS = USER_ROLES.reduce(
  (acc, role) => {
    acc[role] = new Set<Permission>(
      role === "admin" ? PERMISSIONS : BASE_MATRIX[role],
    );
    return acc;
  },
  {} as Record<UserRole, ReadonlySet<Permission>>,
);

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Any of the roles grants the permission. */
export function canAny(roles: readonly UserRole[], permission: Permission): boolean {
  return roles.some((r) => can(r, permission));
}

export class AuthorizationError extends Error {
  constructor(
    public readonly role: UserRole,
    public readonly permission: Permission,
  ) {
    super(`Role "${role}" is not permitted to "${permission}"`);
    this.name = "AuthorizationError";
  }
}

export function assertCan(role: UserRole, permission: Permission): void {
  if (!can(role, permission)) throw new AuthorizationError(role, permission);
}
