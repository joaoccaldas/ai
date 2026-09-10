from noema.review_queue import build_review_queue


def test_review_queue_deduplicates_and_never_promotes():
    docs = [
        (
            "data/candidates/daily/2026-09-09.json",
            {
                "date": "2026-09-09",
                "review_items": [
                    {"priority": "HIGH", "target": "KINSHIP", "reason": "Review burial kinship."},
                    {"priority": "LOW", "target": "OTHER", "reason": "Check metadata."},
                ],
            },
        ),
        (
            "data/candidates/daily/2026-09-10.json",
            {
                "date": "2026-09-10",
                "review_items": [
                    {"priority": "CRITICAL", "target": "KINSHIP", "reason": "Review burial kinship."},
                ],
            },
        ),
    ]
    queue = build_review_queue(docs)
    assert queue["status"] == "REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION"
    assert queue["summary"]["raw_review_items"] == 3
    assert queue["summary"]["deduplicated_review_items"] == 2
    first = queue["items"][0]
    assert first["priority"] == "CRITICAL"
    assert first["occurrences"] == 2
    assert first["candidate_only"] is True
    assert first["human_review_required"] is True
    assert first["automatic_promotion"] is False


def test_review_queue_normalizes_legacy_item_shape():
    queue = build_review_queue([
        (
            "data/candidates/daily/2026-09-10.json",
            {"review_items": [{"priority": "CRITICAL", "item": "Review chronology."}]},
        )
    ])
    assert queue["items"][0]["target"] == "GENERAL_REVIEW"
    assert queue["items"][0]["reason"] == "Review chronology."
    assert queue["items"][0]["first_seen"] == "2026-09-10"
