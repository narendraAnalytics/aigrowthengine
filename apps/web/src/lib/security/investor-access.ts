/**
 * Investor Room access levels (Phase 0.5).
 *
 * Graded, revocable, audited. A viewer holds one level; a document/section
 * requires a minimum level. Access is checked at the resource and every grant,
 * revoke and view is audited (see audit.ts).
 *
 * NOTE: the Investor Room itself is Phase 7 — do not build it before raising
 * (roadmap Section 0). This module only fixes the vocabulary now.
 */

export const INVESTOR_ACCESS_LEVELS = [
  "public", // anyone — teaser / one-pager
  "registered", // signed up + identified
  "approved", // manually approved by the team — standard data room
  "restricted", // sensitive materials — cap table, contracts, board decks
] as const;
export type InvestorAccessLevel = (typeof INVESTOR_ACCESS_LEVELS)[number];

const RANK: Record<InvestorAccessLevel, number> = Object.fromEntries(
  INVESTOR_ACCESS_LEVELS.map((lvl, i) => [lvl, i]),
) as Record<InvestorAccessLevel, number>;

export function investorAccessRank(level: InvestorAccessLevel): number {
  return RANK[level];
}

/** True if `actual` satisfies the `required` minimum level. */
export function meetsInvestorAccess(
  actual: InvestorAccessLevel,
  required: InvestorAccessLevel,
): boolean {
  return RANK[actual] >= RANK[required];
}
