#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import urllib.request
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

URL = "https://raw.githubusercontent.com/religionhistory/SCCSR/main/data_clean/drh_tables.zip"
csv.field_size_limit(20_000_000)


def fetch_archive() -> tuple[zipfile.ZipFile, str]:
    req = urllib.request.Request(URL, headers={"User-Agent": "NOEMA/1.0 (+https://github.com/joaoccaldas/ai)"})
    with urllib.request.urlopen(req, timeout=180) as r:
        payload = r.read()
    return zipfile.ZipFile(io.BytesIO(payload)), hashlib.sha256(payload).hexdigest()


def csv_rows(z: zipfile.ZipFile, suffix: str):
    name = next((n for n in z.namelist() if n.endswith(suffix)), None)
    if not name:
        raise RuntimeError(f"{suffix} missing from DRH archive")
    with z.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", newline=""))


def bool_state(answer: str, value: str) -> str | None:
    a = (answer or "").strip().lower()
    if a in {"yes", "true"}:
        return "PRESENT"
    if a in {"no", "false"}:
        return "ABSENT"
    unknown_terms = ("don't know", "doesn't know", "do not know", "field doesn't know", "unknown")
    if (value or "").strip() == "-1" or any(x in a for x in unknown_terms):
        return "UNKNOWN"
    # DRH also uses numeric answer_value for non-binary categorical questions.
    # Never reinterpret those as boolean presence/absence.
    return None


def unit_type(poll: str) -> str:
    p = (poll or "").lower()
    if p.startswith("religious group"):
        return "RELIGIOUS_GROUP"
    if p.startswith("religious place"):
        return "RELIGIOUS_PLACE"
    if p.startswith("religious text"):
        return "RELIGIOUS_TEXT"
    if p.startswith("religious ritual"):
        return "RELIGIOUS_RITUAL"
    return "OTHER_DRH_ENTRY"


def load_mapping(path: Path):
    text = path.read_text(encoding="utf-8")
    doc = json.loads(text)
    return doc, hashlib.sha256(text.encode("utf-8")).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mapping", default="ontology/drh_curated_mappings.json")
    ap.add_argument("--output", default="site/drh-decomposition.json")
    args = ap.parse_args()
    mapping, mapping_digest = load_mapping(Path(args.mapping))
    qmap = mapping["questions"]
    z, archive_digest = fetch_archive()

    regions = {}
    for r in csv_rows(z, "region_data.csv"):
        regions[r["region_id"]] = {
            "name": r.get("region_name"),
            "description": (r.get("region_description") or "")[:500] or None,
            "world_region": r.get("world_region"),
            "tag_name": r.get("region_tag_name"),
            "tag_path": r.get("path"),
        }

    tags = defaultdict(list)
    for t in csv_rows(z, "entity_tags.csv"):
        tags[t["entry_id"]].append({
            "id": t.get("entrytag_id") or None,
            "name": t.get("entrytag_name") or None,
            "level": t.get("entrytag_level") or None,
            "path": t.get("entrytag_path") or None,
            "parent_id": t.get("parent_entrytag_id") or None,
        })

    entries = {}
    for e in csv_rows(z, "entry_data.csv"):
        eid = e["entry_id"]
        reg = regions.get(e.get("region_id"), {})
        typ = unit_type(e.get("poll_name") or "")
        entries[eid] = {
            "id": f"DRH:{eid}",
            "upstream_id": eid,
            "name": e.get("entry_name") or eid,
            "source": "DRH",
            "unit_type": typ,
            "comparable_belief_system": typ == "RELIGIOUS_GROUP",
            "poll_id": e.get("poll_id") or None,
            "poll_name": e.get("poll_name") or None,
            "description": (e.get("description") or "")[:800] or None,
            "year_from": e.get("year_from") or None,
            "year_to": e.get("year_to") or None,
            "region_id": e.get("region_id") or None,
            "region_name": reg.get("name"),
            "world_region": reg.get("world_region"),
            "region_tag": reg.get("tag_name"),
            "expert_id": e.get("expert_id") or None,
            "expert_name": e.get("expert_name") or None,
            "editor_id": e.get("editor_id") or None,
            "editor_name": e.get("editor_name") or None,
            "date_created": e.get("date_created") or None,
            "date_modified": e.get("date_modified") or None,
            "data_source": e.get("data_source") or None,
            "tags": tags.get(eid, []),
        }

    question_meta: dict[str, dict] = {}
    assertions = []
    question_counts = Counter()
    state_counts = Counter()
    dimension_counts = Counter()
    nonbinary_mapped_rows = 0
    total_answer_rows = 0

    for a in csv_rows(z, "answerset.csv"):
        total_answer_rows += 1
        qid = a.get("question_id") or ""
        if not qid:
            continue
        qname = (a.get("question_name") or "").strip()
        parent = (a.get("parent_question") or "").strip()
        qm = question_meta.setdefault(qid, {
            "id": qid,
            "name": qname,
            "parent_question_id": a.get("parent_question_id") or None,
            "parent_question": parent or None,
            "poll_names": set(),
            "answer_rows": 0,
            "mapped": qid in qmap,
        })
        if a.get("poll_name"):
            qm["poll_names"].add(a["poll_name"])
        qm["answer_rows"] += 1

        if qid not in qmap:
            continue
        spec = qmap[qid]
        expected = spec["expected"].strip()
        if qname != expected:
            raise RuntimeError(f"DRH question semantic drift for {qid}: expected {expected!r}, got {qname!r}")
        if spec.get("parent_expected") and parent != spec["parent_expected"].strip():
            raise RuntimeError(f"DRH parent semantic drift for {qid}: expected {spec['parent_expected']!r}, got {parent!r}")
        eid = a.get("entry_id")
        if not eid or eid not in entries:
            continue
        st = bool_state(a.get("answer") or "", a.get("answer_value") or "")
        if st is None:
            nonbinary_mapped_rows += 1
            continue
        e = entries[eid]
        question_counts[qid] += 1
        state_counts[st] += 1
        qm["mappings"] = spec["mappings"]
        for m in spec["mappings"]:
            status = "NEEDS_REVIEW" if m.get("conditional") else "CURATED_CROSSWALK_V1"
            row = {
                "subject_id": e["id"],
                "subject_name": e["name"],
                "unit_type": e["unit_type"],
                "state": st,
                "dimension": m["dimension"],
                "facet": m["facet"],
                "source_id": "DRH",
                "review_status": "UPSTREAM_EXPERT_CODED_MAPPING_REVIEW_PENDING",
                "mapping_status": status,
                "temporal_scope": "HISTORICAL_ATTESTED",
                "year_from": a.get("year_from") or e["year_from"],
                "year_to": a.get("year_to") or e["year_to"],
                "world_region": e["world_region"],
                "region_name": e["region_name"],
                "region_id": a.get("region_id") or e["region_id"],
                "poll_name": a.get("poll_name") or e["poll_name"],
                "upstream_question_id": qid,
                "upstream_question_name": qname,
                "upstream_parent_question": parent or None,
                "upstream_answer": a.get("answer") or None,
                "upstream_answer_value": a.get("answer_value") or None,
                "branching_question": a.get("branching_question") or None,
                "expert_id": a.get("expert_id") or e["expert_id"],
                "expert_name": a.get("expert_name") or e["expert_name"],
                "editor_id": a.get("editor_id") or e["editor_id"],
                "editor_name": a.get("editor_name") or e["editor_name"],
                "date_published": a.get("date_published") or None,
                "date_modified": a.get("date_modified") or None,
                "has_notes": bool((a.get("notes") or "").strip()),
                "source_locator": {
                    "table": "answerset.csv",
                    "entry_id": eid,
                    "question_id": qid,
                    "region_id": a.get("region_id") or None,
                    "expert_id": a.get("expert_id") or None,
                },
            }
            if m.get("qualifier"):
                row["qualifier"] = m["qualifier"]
            assertions.append(row)
            dimension_counts[m["dimension"]] += 1

    used_ids = {a["subject_id"].split(":", 1)[1] for a in assertions}
    # Keep every published entry searchable, not only entries touched by the curated crosswalk.
    subjects = [entries[eid] for eid in sorted(entries, key=lambda x: int(x) if x.isdigit() else x)]
    for q in question_meta.values():
        q["poll_names"] = sorted(q["poll_names"])
    questions = sorted(question_meta.values(), key=lambda q: int(q["id"]) if q["id"].isdigit() else q["id"])

    out = {
        "dataset_id": "NOEMA-RELIGION-DECOMPOSITION-DRH-V1",
        "status": "research-preview",
        "source": {
            "name": "Database of Religious History / Standard Cross-Cultural Sample of Religion",
            "repo": "https://github.com/religionhistory/SCCSR",
            "archive_url": URL,
            "archive_sha256": archive_digest,
            "license": "CC-BY-4.0",
        },
        "crosswalk": {
            "mapping_id": mapping["mapping_id"],
            "version": mapping["version"],
            "sha256": mapping_digest,
            "rules": mapping["rules"],
        },
        "semantics": {
            "curated": "Question meaning was manually crosswalked to a NOEMA facet, but the resulting expert-coded assertion remains reviewable.",
            "conditional": "A plausible bridge explicitly excluded from accepted profile comparisons until reviewed.",
            "unit_guard": "RELIGIOUS_GROUP entries may be compared as belief-system profiles; RELIGIOUS_PLACE/TEXT/RITUAL entries are context units and must not be silently treated as whole religions.",
            "unknown": "Unknown is retained as unknown and never converted to absence.",
            "question_index": "All standardized DRH questions remain searchable metadata even when NOEMA has no semantic crosswalk.",
            "conflict": "Different expert, date, region or branching-population answers remain separate rows rather than being majority-voted away.",
        },
        "summary": {
            "subjects": len(subjects),
            "subjects_with_mapped_assertions": len(used_ids),
            "comparable_religious_groups": sum(1 for s in subjects if s["comparable_belief_system"]),
            "questions": len(questions),
            "mapped_questions": sum(1 for q in questions if q["mapped"]),
            "answer_rows": total_answer_rows,
            "assertions": len(assertions),
            "nonbinary_mapped_rows_skipped": nonbinary_mapped_rows,
            "states": dict(state_counts),
            "dimensions": dict(sorted(dimension_counts.items())),
        },
        "subjects": subjects,
        "questions": questions,
        "assertions": assertions,
    }
    p = Path(args.output)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(out["summary"], indent=2))


if __name__ == "__main__":
    main()
