"""Map a Sarvam instant-outbound webhook payload to one of our call outcomes.

Pure function, unit-tested. The vocabulary matches the `voice_call_outcome` enum
in apps/web and `src/lib/voice/outcome.ts`.

The agent is configured (in the Sarvam dashboard) to set these agent variables
before hangup:
    interest            : "yes" | "no" | "maybe"
    wants_consultation  : bool-ish
    callback_window     : str | null
"""

from __future__ import annotations

from app.schemas.voice import SarvamEndPayload

OUTCOMES = {
    "interested",
    "consultation_requested",
    "callback_requested",
    "not_interested",
    "no_answer",
    "completed_unclear",
}


def _truthy(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"yes", "true", "y", "1", "wants", "requested"}
    return False


def _transcript_text(payload: SarvamEndPayload) -> str:
    return " ".join(
        (turn.en_text or "").lower() for turn in payload.interaction_transcript
    )


def derive_outcome(payload: SarvamEndPayload) -> str:
    """Return one of OUTCOMES for the given end-of-call payload."""
    if (payload.status or "").lower() != "connected":
        return "no_answer"

    vars_ = payload.final_agent_variables or {}
    interest = str(vars_.get("interest", "")).strip().lower()
    wants_consult = _truthy(vars_.get("wants_consultation"))
    callback_window = vars_.get("callback_window")
    text = _transcript_text(payload)

    if interest in {"no", "not interested"}:
        return "not_interested"

    if interest in {"yes", "interested"}:
        if wants_consult:
            return "consultation_requested"
        return "interested"

    if callback_window or "call me back" in text or "call back" in text:
        return "callback_requested"

    if interest in {"maybe", "unsure"}:
        return "completed_unclear"

    return "completed_unclear"


def transcript_pairs(payload: SarvamEndPayload) -> list[dict[str, str]]:
    """Normalise the Sarvam transcript to [{role, text}] for the web callback."""
    out: list[dict[str, str]] = []
    for turn in payload.interaction_transcript:
        role = "agent" if (turn.role or "").lower() in {"agent", "assistant", "bot"} else "user"
        out.append({"role": role, "text": turn.en_text or ""})
    return out
