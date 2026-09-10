from datetime import datetime, timezone

from noema.automation_pulse import build


def test_clock_skew_is_clamped_and_audited():
    now = datetime(2026, 9, 10, 6, 12, tzinfo=timezone.utc)
    manifests = [{
        "run_id": "future-run",
        "task_type": "DAILY_INGEST",
        "status": "COMPLETED",
        "started_at": "2026-09-10T06:08:00Z",
        "completed_at": "2026-09-10T06:14:30Z",
        "errors": [],
    }]
    contract = {"tasks": [{
        "task_type": "DAILY_INGEST",
        "scheduler": "CHATGPT_AUTOMATION",
        "cadence": "DAILY",
        "expected_interval_hours": 30,
        "authority": "CANDIDATE_TRIAGE_ONLY",
        "next_stage": "HUMAN_REVIEW",
        "writes": ["candidate triage"],
    }]}
    pulse = build(manifests, contract, now=now)
    health = pulse["task_health"][0]
    assert health["age_hours"] == 0.0
    assert health["clock_skew_detected"] is True
    assert health["health"] == "HEALTHY"
    anomalies = pulse["observability_anomalies"]["clock_skew"]
    assert len(anomalies) == 1
    assert anomalies[0]["run_id"] == "future-run"
    assert anomalies[0]["raw_age_hours"] < 0


def test_normal_timestamp_has_no_clock_skew():
    now = datetime(2026, 9, 10, 8, 0, tzinfo=timezone.utc)
    manifests = [{
        "run_id": "normal-run",
        "task_type": "GITHUB_DISCOVERY",
        "status": "COMPLETED",
        "completed_at": "2026-09-10T06:00:00Z",
        "errors": [],
    }]
    contract = {"tasks": [{
        "task_type": "GITHUB_DISCOVERY",
        "expected_interval_hours": 26,
        "authority": "CANDIDATE_DISCOVERY_ONLY",
        "next_stage": "DAILY_INGEST",
        "writes": ["artifact"],
    }]}
    pulse = build(manifests, contract, now=now)
    assert pulse["task_health"][0]["age_hours"] == 2.0
    assert pulse["task_health"][0]["clock_skew_detected"] is False
    assert pulse["observability_anomalies"]["clock_skew"] == []
