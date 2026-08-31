/**
 * Shared shape for the assessment emails. Assembled by
 * `src/server/email/assessment-emails.ts` from the persisted result.
 */
export type AssessmentEmailMatch = {
  name: string;
  oneLiner: string;
  confidencePct: number;
  matchClass: "strong" | "partial" | "none";
  inDiscovery: boolean;
};

export type AssessmentEmailFactor = {
  label: string;
  weight: number;
  level: string;
  points: number;
  rationale: string;
};

export type AssessmentEmailData = {
  company: string;
  contactEmail: string;
  contactNote?: string | null;
  band: "high" | "medium" | "low";
  score: number;
  summary: string | null;
  narrative: { summary: string; steps: string[] } | null;
  matches: AssessmentEmailMatch[];
  breakdown: AssessmentEmailFactor[];
  noConfidentMatch: boolean;
  resultUrl: string;
  approvalUrl: string;
};

export const BAND_LABEL: Record<AssessmentEmailData["band"], string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};
