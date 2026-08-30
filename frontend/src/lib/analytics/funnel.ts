import { ANALYTICS_EVENTS } from "./events";

/**
 * The acquisition funnel (Phase 0.6), from FinalRoadMap §10.
 *
 * Each stage is marked by exactly one analytics event (`funnelStage` in
 * events.ts). Conversion rates between adjacent stages are the core product KPIs
 * and feed the MVP success criteria (success-criteria.ts).
 */
export const FUNNEL_STAGES = [
  "visitor",
  "assessment_started",
  "assessment_completed",
  "capability_matched",
  "qualified",
  "consultation",
  "proposal",
  "pilot",
  "won",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

/** stage -> the event that marks entry into it. */
export const STAGE_EVENT: Record<FunnelStage, string> = Object.fromEntries(
  FUNNEL_STAGES.map((stage) => {
    const e = ANALYTICS_EVENTS.find((x) => x.funnelStage === stage);
    if (!e) throw new Error(`Funnel stage "${stage}" has no analytics event`);
    return [stage, e.name];
  }),
) as Record<FunnelStage, string>;

export function funnelStageIndex(stage: FunnelStage): number {
  return FUNNEL_STAGES.indexOf(stage);
}

/** Adjacent-stage conversion pairs, e.g. ["assessment_completed","capability_matched"]. */
export function funnelTransitions(): Array<[FunnelStage, FunnelStage]> {
  const pairs: Array<[FunnelStage, FunnelStage]> = [];
  for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
    pairs.push([FUNNEL_STAGES[i]!, FUNNEL_STAGES[i + 1]!]);
  }
  return pairs;
}
