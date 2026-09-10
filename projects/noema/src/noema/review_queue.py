from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date
from typing import Iterable

PRIORITY_WEIGHT = {
    "CRITICAL": 100,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25,
}


def _normalize_text(value: str) -> str:
    value = re.sub(r"\s+", " ", (value or "").strip())
    return value


def _fingerprint(target: str, text: str) -> str:
    key = f"{target.lower()}|{re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]


@dataclass(frozen=True)
class ReviewQueueItem:
    review_id: str
    priority: str
    target: str
    reason: str
    first_seen: str
    last_seen: str
    occurrences: int
    source_files: tuple[str, ...]
    candidate_only: bool = True
    human_review_required: bool = True
    automatic_promotion: bool = False

    @property
    def priority_score(self) -> int:
        recency = int(self.last_seen.replace("-", "")) if self.last_seen else 0
        recurrence_bonus = min(20, max(0, self.occurrences - 1) * 4)
        return PRIORITY_WEIGHT.get(self.priority, 0) * 1_000_000_000 + recurrence_bonus * 1_000_000 + recency


def _extract_item(raw: dict, source_date: str, source_file: str) -> dict | None:
    priority = str(raw.get("priority") or "MEDIUM").upper()
    if priority not in PRIORITY_WEIGHT:
        priority = "MEDIUM"
    target = _normalize_text(str(raw.get("target") or raw.get("review_target") or "GENERAL_REVIEW"))
    reason = _normalize_text(str(raw.get("reason") or raw.get("item") or raw.get("finding") or ""))
    if not reason:
        return None
    return {
        "priority": priority,
        "target": target,
        "reason": reason,
        "date": source_date,
        "source_file": source_file,
    }


def build_review_queue(candidate_docs: Iterable[tuple[str, dict]]) -> dict:
    """Build a deterministic, non-promoting queue from candidate triage documents.

    Input tuples are `(source_file, document)`. A date is read from the document when
    available and otherwise inferred from YYYY-MM-DD in the filename.
    """
    groups: dict[str, dict] = {}
    source_doc_count = 0
    raw_item_count = 0

    for source_file, doc in candidate_docs:
        source_doc_count += 1
        source_date = str(doc.get("date") or doc.get("run_date") or "")
        if not source_date:
            match = re.search(r"(20\d{2}-\d{2}-\d{2})", source_file)
            source_date = match.group(1) if match else date.min.isoformat()
        for raw in doc.get("review_items") or []:
            raw_item_count += 1
            if not isinstance(raw, dict):
                continue
            item = _extract_item(raw, source_date, source_file)
            if item is None:
                continue
            fp = _fingerprint(item["target"], item["reason"])
            current = groups.get(fp)
            if current is None:
                groups[fp] = {
                    "review_id": f"REV-{fp.upper()}",
                    "priority": item["priority"],
                    "target": item["target"],
                    "reason": item["reason"],
                    "first_seen": item["date"],
                    "last_seen": item["date"],
                    "occurrences": 1,
                    "source_files": {item["source_file"]},
                }
                continue
            current["first_seen"] = min(current["first_seen"], item["date"])
            current["last_seen"] = max(current["last_seen"], item["date"])
            current["occurrences"] += 1
            current["source_files"].add(item["source_file"])
            if PRIORITY_WEIGHT[item["priority"]] > PRIORITY_WEIGHT[current["priority"]]:
                current["priority"] = item["priority"]

    items = [
        ReviewQueueItem(
            review_id=v["review_id"],
            priority=v["priority"],
            target=v["target"],
            reason=v["reason"],
            first_seen=v["first_seen"],
            last_seen=v["last_seen"],
            occurrences=v["occurrences"],
            source_files=tuple(sorted(v["source_files"])),
        )
        for v in groups.values()
    ]
    items.sort(key=lambda x: (-x.priority_score, x.review_id))

    counts = {p: sum(1 for x in items if x.priority == p) for p in PRIORITY_WEIGHT}
    return {
        "queue_id": "NOEMA-HUMAN-REVIEW-QUEUE-V1",
        "queue_version": 1,
        "status": "REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION",
        "principle": "The queue prioritizes review work only. Rank is not evidential strength and cannot promote a candidate, claim, relationship or hypothesis.",
        "ranking_note": "Priority, recurrence and recency rank workflow attention only; they are not measures of truth, effect size or evidential strength.",
        "summary": {
            "source_documents": source_doc_count,
            "raw_review_items": raw_item_count,
            "deduplicated_review_items": len(items),
            "by_priority": counts,
        },
        "items": [
            {
                "review_id": x.review_id,
                "priority": x.priority,
                "target": x.target,
                "reason": x.reason,
                "first_seen": x.first_seen,
                "last_seen": x.last_seen,
                "occurrences": x.occurrences,
                "source_files": list(x.source_files),
                "candidate_only": x.candidate_only,
                "human_review_required": x.human_review_required,
                "automatic_promotion": x.automatic_promotion,
            }
            for x in items
        ],
    }
