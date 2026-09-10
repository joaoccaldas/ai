from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .epistemic_stage import is_valid_stage


TASK_ORDER = {
    "DAILY_INGEST": 0,
    "WEEKLY_REANALYSIS": 1,
    "MONTHLY_DISCOVERY": 2,
    "GITHUB_DISCOVERY": 3,
    "PUBMED_DISCOVERY": 4,
    "DPLACE_BENCHMARK": 5,
    "RELIGION_FEDERATION": 6,
    "MEDIA_DISCOVERY": 7,
    "MUSEUM_MEDIA_DISCOVERY": 8,
    "OTHER": 99,
}


def load_manifests(root: Path) -> list[dict]:
    out = []
    if not root.exists():
        return out
    for path in sorted(root.glob("*.json")):
        try:
            doc = json.loads(path.read_text())
        except Exception:
            continue
        if not isinstance(doc, dict) or not doc.get("run_id"):
            continue
        doc["_path"] = str(path)
        out.append(doc)
    return out


def load_contract(path: Path) -> dict:
    if not path.exists():
        return {"tasks": []}
    try:
        doc = json.loads(path.read_text())
    except Exception:
        return {"tasks": []}
    return doc if isinstance(doc, dict) else {"tasks": []}


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _safe_stage(value: str | None) -> str | None:
    return value if is_valid_stage(value) else None


def build(manifests: list[dict], contract: dict | None = None, now: datetime | None = None) -> dict:
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    contract = contract or {}

    def key(m: dict):
        return m.get("completed_at") or m.get("started_at") or ""

    manifests = sorted(manifests, key=key, reverse=True)
    latest_by_type: dict[str, dict] = {}
    for m in manifests:
        latest_by_type.setdefault(m.get("task_type", "OTHER"), m)
    recent = manifests[:20]
    totals = {
        "runs": len(manifests),
        "new_candidates": sum(int(m.get("new_candidates", 0) or 0) for m in recent),
        "contradictions": sum(int(m.get("contradictions", 0) or 0) for m in recent),
        "dating_revisions": sum(int(m.get("dating_revisions", 0) or 0) for m in recent),
        "hypotheses_revisited": sum(int(m.get("hypotheses_revisited", 0) or 0) for m in recent),
        "review_items_created": sum(int(m.get("review_items_created", 0) or 0) for m in recent),
        "errors": sum(len(m.get("errors", []) or []) for m in recent),
    }
    latest = []
    for task, m in sorted(latest_by_type.items(), key=lambda kv: TASK_ORDER.get(kv[0], 98)):
        latest.append({
            "task_type": task,
            "run_id": m.get("run_id"),
            "status": m.get("status"),
            "completed_at": m.get("completed_at"),
            "max_epistemic_stage": _safe_stage(m.get("max_epistemic_stage")),
            "summary": m.get("summary", ""),
            "errors": m.get("errors", []),
            "research_note": m.get("research_note"),
        })

    task_health = []
    clock_skew_events = []
    for spec in contract.get("tasks", []):
        task = spec.get("task_type", "OTHER")
        last = latest_by_type.get(task)
        completed = parse_time((last or {}).get("completed_at") or (last or {}).get("started_at"))
        interval = float(spec.get("expected_interval_hours") or 0)
        raw_age_hours = ((now - completed).total_seconds() / 3600) if completed else None
        clock_skew = bool(raw_age_hours is not None and raw_age_hours < 0)
        age_hours = max(0.0, raw_age_hours) if raw_age_hours is not None else None
        if clock_skew:
            clock_skew_events.append({
                "task_type": task,
                "run_id": (last or {}).get("run_id"),
                "observed_completed_at": (last or {}).get("completed_at") or (last or {}).get("started_at"),
                "pulse_generated_at": now.isoformat(),
                "raw_age_hours": round(raw_age_hours, 4),
            })
        if not last:
            health = "NEVER_RUN"
        elif (last.get("errors") or []) or str(last.get("status", "")).upper() in {"FAILED", "ERROR"}:
            health = "ERROR"
        elif interval and age_hours is not None and age_hours > interval:
            health = "OVERDUE"
        else:
            health = "HEALTHY"
        task_health.append({
            "task_type": task,
            "scheduler": spec.get("scheduler"),
            "workflow_path": spec.get("workflow_path"),
            "cadence": spec.get("cadence"),
            "schedule": spec.get("schedule"),
            "authority": spec.get("authority"),
            "authority_epistemic_ceiling": _safe_stage(spec.get("max_epistemic_stage")),
            "run_reported_epistemic_stage": _safe_stage((last or {}).get("max_epistemic_stage")),
            "next_stage": spec.get("next_stage"),
            "expected_interval_hours": interval,
            "health": health,
            "last_run_id": (last or {}).get("run_id"),
            "last_status": (last or {}).get("status"),
            "last_completed_at": (last or {}).get("completed_at"),
            "age_hours": round(age_hours, 2) if age_hours is not None else None,
            "clock_skew_detected": clock_skew,
            "writes": spec.get("writes", []),
        })

    return {
        "report_id": "NOEMA-AUTOMATION-PULSE-V2",
        "generated_at": now.isoformat(),
        "registry_id": contract.get("registry_id") or contract.get("contract_id"),
        "registry_version": contract.get("version"),
        "status": "OBSERVABILITY_ONLY",
        "principle": "Automation output is research workflow state, not evidence. Promotion still requires explicit review gates.",
        "totals_recent": totals,
        "latest_by_task": latest,
        "task_health": task_health,
        "observability_anomalies": {"clock_skew": clock_skew_events},
        "recent_runs": [{k: v for k, v in m.items() if k != "_path"} for m in recent],
    }
