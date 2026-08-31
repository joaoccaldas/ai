from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

TASK_ORDER = {"DAILY_INGEST": 0, "WEEKLY_REANALYSIS": 1, "MONTHLY_DISCOVERY": 2, "GITHUB_DISCOVERY": 3, "DPLACE_BENCHMARK": 4, "RELIGION_FEDERATION": 5, "MEDIA_DISCOVERY": 6, "OTHER": 9}


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


def build(manifests: list[dict], contract: dict | None = None, now: datetime | None = None) -> dict:
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)

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
    for task, m in sorted(latest_by_type.items(), key=lambda kv: TASK_ORDER.get(kv[0], 99)):
        latest.append({
            "task_type": task,
            "run_id": m.get("run_id"),
            "status": m.get("status"),
            "completed_at": m.get("completed_at"),
            "summary": m.get("summary", ""),
            "errors": m.get("errors", []),
            "research_note": m.get("research_note"),
        })

    task_health = []
    for spec in (contract or {}).get("tasks", []):
        task = spec.get("task_type", "OTHER")
        last = latest_by_type.get(task)
        completed = parse_time((last or {}).get("completed_at") or (last or {}).get("started_at"))
        interval = float(spec.get("expected_interval_hours") or 0)
        age_hours = ((now - completed).total_seconds() / 3600) if completed else None
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
            "cadence": spec.get("cadence"),
            "schedule": spec.get("schedule"),
            "authority": spec.get("authority"),
            "next_stage": spec.get("next_stage"),
            "expected_interval_hours": interval,
            "health": health,
            "last_run_id": (last or {}).get("run_id"),
            "last_status": (last or {}).get("status"),
            "last_completed_at": (last or {}).get("completed_at"),
            "age_hours": round(age_hours, 2) if age_hours is not None else None,
            "writes": spec.get("writes", []),
        })

    return {
        "report_id": "NOEMA-AUTOMATION-PULSE-V1",
        "generated_at": now.isoformat(),
        "status": "OBSERVABILITY_ONLY",
        "principle": "Automation output is research workflow state, not evidence. Promotion still requires explicit review gates.",
        "totals_recent": totals,
        "latest_by_task": latest,
        "task_health": task_health,
        "recent_runs": [{k: v for k, v in m.items() if k != "_path"} for m in recent],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs-dir", default="projects/noema/data/runs")
    ap.add_argument("--contract", default="projects/noema/data/automation-contract-v1.json")
    ap.add_argument("--output", default="projects/noema/site/automation-pulse.json")
    args = ap.parse_args()
    manifests = load_manifests(Path(args.runs_dir))
    contract = load_contract(Path(args.contract))
    output = build(manifests, contract)
    p = Path(args.output)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print("automation pulse", len(manifests), "runs /", len(output.get("task_health", [])), "contract tasks ->", p)


if __name__ == "__main__":
    main()
