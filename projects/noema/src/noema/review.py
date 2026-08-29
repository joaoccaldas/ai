from __future__ import annotations

from dataclasses import dataclass

PENDING = "PENDING_REVIEW"
APPROVED = "APPROVED"
REJECTED = "REJECTED"
REOPENED = "REOPENED"


@dataclass(frozen=True)
class ReviewTransition:
    from_status: str
    to_status: str
    action: str


_ALLOWED: dict[tuple[str, str], str] = {
    (PENDING, APPROVED): "APPROVE",
    (PENDING, REJECTED): "REJECT",
    (REJECTED, REOPENED): "REOPEN",
    (REOPENED, APPROVED): "APPROVE",
    (REOPENED, REJECTED): "REJECT",
}


def transition(from_status: str, to_status: str) -> ReviewTransition:
    key = (from_status, to_status)
    if key not in _ALLOWED:
        raise ValueError(f"invalid review transition: {from_status} -> {to_status}")
    return ReviewTransition(from_status, to_status, _ALLOWED[key])


def can_create_evidence(status: str) -> bool:
    return status == APPROVED
