import { z } from "zod";
import { CAPABILITY_DATA } from "./data";
import {
  capabilitySchema,
  type Capability,
  type Industry,
  type ProblemType,
} from "./schema";

/**
 * Parsed, validated Capability Library. Import `CAPABILITIES` — never `CAPABILITY_DATA`
 * directly. Parsing happens once at module load and throws on any malformed record
 * or duplicate id, so a bad edit fails fast in dev / CI rather than at request time.
 */
function loadCapabilities(): readonly Capability[] {
  const parsed = z.array(capabilitySchema).parse(CAPABILITY_DATA);

  const seen = new Set<string>();
  for (const c of parsed) {
    if (seen.has(c.id)) {
      throw new Error(`Duplicate capability id: "${c.id}"`);
    }
    seen.add(c.id);
  }
  return Object.freeze(parsed);
}

export const CAPABILITIES = loadCapabilities();

/** Set of valid ids — use to validate anything the model returns (CLAUDE.md #2). */
export const CAPABILITY_IDS: ReadonlySet<string> = new Set(
  CAPABILITIES.map((c) => c.id),
);

export function isKnownCapabilityId(id: string): boolean {
  return CAPABILITY_IDS.has(id);
}

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}

/**
 * Keep only ids that actually exist. The matcher MUST pass model output through
 * this before using it — the model may hallucinate an id.
 */
export function filterKnownCapabilityIds(ids: readonly string[]): string[] {
  return ids.filter((id) => CAPABILITY_IDS.has(id));
}

export function capabilitiesForProblemType(pt: ProblemType): Capability[] {
  return CAPABILITIES.filter((c) => c.problemTypes.includes(pt));
}

export function capabilitiesForIndustry(industry: Industry): Capability[] {
  return CAPABILITIES.filter((c) => c.industries.includes(industry));
}

export {
  PROBLEM_TYPES,
  INDUSTRIES,
  DELIVERY_STATUSES,
  problemTypeSchema,
  industrySchema,
  capabilitySchema,
} from "./schema";
export type {
  Capability,
  ProblemType,
  Industry,
  DeliveryStatus,
} from "./schema";
