from __future__ import annotations

from app.schemas.voice import SarvamEndPayload
from app.services.voice_outcome import derive_outcome, transcript_pairs


def _payload(**kw: object) -> SarvamEndPayload:
    base: dict[str, object] = {
        "attempt_id": "att_1",
        "status": "connected",
        "duration": 120,
        "final_agent_variables": {},
        "interaction_transcript": [],
        "webhook_config": {"metadata": {}},
    }
    base.update(kw)
    return SarvamEndPayload.model_validate(base)


def test_not_connected_is_no_answer() -> None:
    assert derive_outcome(_payload(status="no_answer")) == "no_answer"
    assert derive_outcome(_payload(status="busy")) == "no_answer"
    assert derive_outcome(_payload(status="failed")) == "no_answer"


def test_interested_without_consultation() -> None:
    p = _payload(final_agent_variables={"interest": "yes"})
    assert derive_outcome(p) == "interested"


def test_interested_with_consultation() -> None:
    p = _payload(final_agent_variables={"interest": "yes", "wants_consultation": True})
    assert derive_outcome(p) == "consultation_requested"


def test_not_interested() -> None:
    p = _payload(final_agent_variables={"interest": "no"})
    assert derive_outcome(p) == "not_interested"


def test_callback_from_variable() -> None:
    p = _payload(final_agent_variables={"callback_window": "tomorrow morning"})
    assert derive_outcome(p) == "callback_requested"


def test_callback_from_transcript() -> None:
    p = _payload(
        interaction_transcript=[{"role": "user", "en_text": "Can you call me back later?"}]
    )
    assert derive_outcome(p) == "callback_requested"


def test_unclear_default() -> None:
    p = _payload(final_agent_variables={"interest": "maybe"})
    assert derive_outcome(p) == "completed_unclear"


def test_transcript_pairs_normalises_roles() -> None:
    p = _payload(
        interaction_transcript=[
            {"role": "agent", "en_text": "Hello"},
            {"role": "user", "en_text": "Hi"},
        ]
    )
    assert transcript_pairs(p) == [
        {"role": "agent", "text": "Hello"},
        {"role": "user", "text": "Hi"},
    ]
