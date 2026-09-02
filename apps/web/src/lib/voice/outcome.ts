/**
 * Voice call outcome vocabulary + display metadata.
 *
 * The set of values matches the `voice_call_outcome` enum in the DB schema and
 * the mapping produced by the FastAPI voice service (`voice_outcome.py`). Kept
 * here so the web app (emails now, an admin list later) has one source of
 * labels/colours.
 */

export const VOICE_CALL_OUTCOMES = [
  "interested",
  "consultation_requested",
  "callback_requested",
  "not_interested",
  "no_answer",
  "completed_unclear",
] as const;

export type VoiceCallOutcome = (typeof VOICE_CALL_OUTCOMES)[number];

export function isVoiceCallOutcome(v: unknown): v is VoiceCallOutcome {
  return (
    typeof v === "string" &&
    (VOICE_CALL_OUTCOMES as readonly string[]).includes(v)
  );
}

export const VOICE_CALL_OUTCOME_META: Record<
  VoiceCallOutcome,
  { label: string; tone: "positive" | "neutral" | "negative" }
> = {
  interested: { label: "Interested", tone: "positive" },
  consultation_requested: {
    label: "Consultation requested",
    tone: "positive",
  },
  callback_requested: { label: "Callback requested", tone: "neutral" },
  not_interested: { label: "Not interested", tone: "negative" },
  no_answer: { label: "No answer", tone: "neutral" },
  completed_unclear: { label: "Completed — unclear", tone: "neutral" },
};

export function voiceCallOutcomeLabel(v: string | null | undefined): string {
  return isVoiceCallOutcome(v) ? VOICE_CALL_OUTCOME_META[v].label : "Pending";
}
