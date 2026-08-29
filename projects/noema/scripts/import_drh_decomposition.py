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
    req=urllib.request.Request(URL,headers={"User-Agent":"NOEMA/1.0 (+https://github.com/joaoccaldas/ai)"})
    with urllib.request.urlopen(req,timeout=180) as r: payload=r.read()
    return zipfile.ZipFile(io.BytesIO(payload)), hashlib.sha256(payload).hexdigest()


def csv_rows(z: zipfile.ZipFile, suffix: str):
    name=next((n for n in z.namelist() if n.endswith(suffix)),None)
    if not name: raise RuntimeError(f"{suffix} missing from DRH archive")
    with z.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f,encoding="utf-8-sig",newline=""))


def state(answer: str, value: str) -> str:
    a=(answer or "").strip().lower(); v=(value or "").strip().lower()
    if v in {"1","true"} or a in {"yes","sí","oui","ja","sim"}: return "PRESENT"
    if v in {"0","false"} or a in {"no","non","nein","não"}: return "ABSENT"
    unknown_terms=("don't know","doesn't know","do not know","field doesn't know","unknown","uncertain")
    if v=="-1" or any(x in a for x in unknown_terms): return "UNKNOWN"
    return "UNKNOWN"


def unit_type(poll: str) -> str:
    p=(poll or "").lower()
    if p.startswith("religious group"): return "RELIGIOUS_GROUP"
    if p.startswith("religious place"): return "RELIGIOUS_PLACE"
    if p.startswith("religious text"): return "RELIGIOUS_TEXT"
    if p.startswith("religious ritual"): return "RELIGIOUS_RITUAL"
    return "OTHER_DRH_ENTRY"


def load_mapping(path: Path):
    text=path.read_text(encoding="utf-8")
    doc=json.loads(text)
    return doc, hashlib.sha256(text.encode("utf-8")).hexdigest()


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mapping",default="ontology/drh_curated_mappings.json")
    ap.add_argument("--output",default="site/drh-decomposition.json")
    args=ap.parse_args()
    mapping,mapping_digest=load_mapping(Path(args.mapping)); qmap=mapping["questions"]
    z,archive_digest=fetch_archive()

    regions={}
    for r in csv_rows(z,"region_data.csv"):
        regions[r["region_id"]]={"name":r.get("region_name"),"world_region":r.get("world_region")}
    tags=defaultdict(list)
    for t in csv_rows(z,"entity_tags.csv"):
        tags[t["entry_id"]].append({"name":t.get("entrytag_name"),"level":t.get("entrytag_level"),"path":t.get("entrytag_path")})
    entries={}
    for e in csv_rows(z,"entry_data.csv"):
        eid=e["entry_id"]; reg=regions.get(e.get("region_id"),{}); typ=unit_type(e.get("poll_name") or "")
        entries[eid]={
            "id":f"DRH:{eid}","upstream_id":eid,"name":e.get("entry_name") or eid,"source":"DRH",
            "unit_type":typ,"comparable_belief_system":typ=="RELIGIOUS_GROUP",
            "poll_name":e.get("poll_name"),"year_from":e.get("year_from") or None,"year_to":e.get("year_to") or None,
            "region_id":e.get("region_id") or None,"region_name":reg.get("name"),"world_region":reg.get("world_region"),
            "tags":tags.get(eid,[]),
        }

    seen_question_meta={}; assertions=[]; question_counts=Counter(); state_counts=Counter(); dimension_counts=Counter()
    for a in csv_rows(z,"answerset.csv"):
        qid=a.get("question_id")
        if qid not in qmap: continue
        spec=qmap[qid]; qname=(a.get("question_name") or "").strip(); parent=(a.get("parent_question") or "").strip()
        expected=spec["expected"].strip()
        if qname != expected:
            raise RuntimeError(f"DRH question semantic drift for {qid}: expected {expected!r}, got {qname!r}")
        if spec.get("parent_expected") and parent != spec["parent_expected"].strip():
            raise RuntimeError(f"DRH parent semantic drift for {qid}: expected {spec['parent_expected']!r}, got {parent!r}")
        eid=a.get("entry_id")
        if not eid or eid not in entries: continue
        st=state(a.get("answer") or "",a.get("answer_value") or "")
        e=entries[eid]; question_counts[qid]+=1; state_counts[st]+=1
        seen_question_meta[qid]={"id":qid,"name":qname,"parent_question":parent or None,"mappings":spec["mappings"]}
        for m in spec["mappings"]:
            status="NEEDS_REVIEW" if m.get("conditional") else "CURATED_CROSSWALK_V1"
            row={
                "subject_id":e["id"],"subject_name":e["name"],"unit_type":e["unit_type"],
                "state":st,"dimension":m["dimension"],"facet":m["facet"],"source_id":"DRH",
                "review_status":"UPSTREAM_EXPERT_CODED_MAPPING_REVIEW_PENDING","mapping_status":status,
                "temporal_scope":"HISTORICAL_ATTESTED","year_from":e["year_from"],"year_to":e["year_to"],
                "world_region":e["world_region"],"region_name":e["region_name"],"poll_name":e["poll_name"],
                "upstream_question_id":qid,"upstream_question_name":qname,"upstream_parent_question":parent or None,
                "upstream_answer":a.get("answer") or None,"upstream_answer_value":a.get("answer_value") or None,
                "branching_question":a.get("branching_question") or None,
                "source_locator":{"table":"answerset.csv","entry_id":eid,"question_id":qid},
            }
            if m.get("qualifier"): row["qualifier"]=m["qualifier"]
            assertions.append(row); dimension_counts[m["dimension"]]+=1

    used_ids={a["subject_id"].split(":",1)[1] for a in assertions}
    subjects=[entries[eid] for eid in sorted(used_ids,key=lambda x:int(x) if x.isdigit() else x)]
    out={
        "dataset_id":"NOEMA-RELIGION-DECOMPOSITION-DRH-V1",
        "status":"research-preview",
        "source":{"name":"Database of Religious History / SCCSR","repo":"https://github.com/religionhistory/SCCSR","archive_url":URL,"archive_sha256":archive_digest,"license":"CC-BY-4.0"},
        "crosswalk":{"mapping_id":mapping["mapping_id"],"version":mapping["version"],"sha256":mapping_digest,"rules":mapping["rules"]},
        "semantics":{
            "curated":"Question meaning was manually crosswalked to a NOEMA facet, but the resulting expert-coded assertion remains reviewable.",
            "conditional":"A plausible bridge that is explicitly excluded from accepted profile comparisons until reviewed.",
            "unit_guard":"RELIGIOUS_GROUP entries may be compared as belief-system profiles; RELIGIOUS_PLACE/TEXT/RITUAL entries are context units and must not be silently treated as whole religions.",
            "unknown":"Unknown is retained as unknown and never converted to absence."
        },
        "summary":{"subjects":len(subjects),"comparable_religious_groups":sum(1 for s in subjects if s["comparable_belief_system"]),"mapped_questions":len(seen_question_meta),"assertions":len(assertions),"states":dict(state_counts),"dimensions":dict(sorted(dimension_counts.items()))},
        "subjects":subjects,"questions":[seen_question_meta[k] for k in sorted(seen_question_meta,key=int)],"assertions":assertions,
    }
    p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(json.dumps(out["summary"],indent=2))

if __name__=="__main__": main()
