#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import json
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

URL = "https://raw.githubusercontent.com/religionhistory/SCCSR/main/data_clean/drh_tables.zip"
csv.field_size_limit(20_000_000)

ROUTES = {
    "AGENCY_ONTOLOGY": ["god", "deit", "supernatural", "spirit", "ancestor", "demon", "angel"],
    "SELF_PERSONHOOD": ["soul", "self", "personhood", "rebirth", "reincarn"],
    "DEATH_AFTERLIFE": ["afterlife", "after death", "dead", "death", "funer", "burial", "heaven", "hell", "resurrection", "reincarn"],
    "COSMOLOGY": ["creation", "cosmolog", "world created", "universe", "cosmos"],
    "NATURE_RELATION": ["nature", "animal", "plant", "landscape", "mountain", "river", "weather", "celestial"],
    "CAUSALITY_DIVINATION": ["divination", "oracle", "omen", "astrolog", "dream", "prophe", "medium"],
    "MORAL_ORDER": ["moral", "punish", "sin", "taboo", "purity", "pollution", "karma", "norm"],
    "SACREDNESS": ["sacred", "holy", "consecr", "relic", "icon", "pilgrimage", "shrine", "temple"],
    "RITUAL_GRAMMAR": ["ritual", "sacrifice", "offering", "prayer", "fast", "feast", "initiat", "pilgrimage", "funer", "chant", "dance", "music", "procession"],
    "ALTERED_STATE_INDUCTION": ["trance", "ecstatic", "possession", "hallucin", "psychoactive", "drug", "intoxic", "alcohol", "meditation", "fasting", "sleep deprivation", "dream"],
    "EXPERIENCE_PHENOMENOLOGY": ["vision", "mystic", "possession", "trance", "ecstasy", "revelation", "dream", "voice"],
    "RELIGIOUS_SPECIALISTS": ["priest", "shaman", "specialist", "monk", "nun", "ascetic", "diviner", "prophet", "medium", "healer"],
    "TRANSMISSION": ["convert", "conversion", "mission", "teach", "scripture", "written", "transmit", "initiat"],
    "MATERIAL_AND_SPACE": ["temple", "shrine", "monument", "tomb", "grave", "icon", "relic", "image", "text", "scripture", "architecture"],
    "SOCIAL_FUNCTION": ["cooper", "hierarch", "political", "social class", "kinship", "warfare", "law", "authority"],
}


def fetch_zip() -> zipfile.ZipFile:
    req = urllib.request.Request(URL, headers={"User-Agent":"NOEMA/1.0 (+https://github.com/joaoccaldas/ai)"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return zipfile.ZipFile(io.BytesIO(r.read()))


def csv_rows(z: zipfile.ZipFile, suffix: str):
    name = next((n for n in z.namelist() if n.endswith(suffix)), None)
    if not name:
        raise RuntimeError(f"{suffix} missing from DRH archive: {z.namelist()}")
    with z.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", newline=""))


def route_question(name: str) -> list[str]:
    q = (name or "").lower()
    return sorted({dim for dim, needles in ROUTES.items() if any(n in q for n in needles)})


def norm_answer(answer: str, value: str) -> str:
    a = (answer or "").strip().lower()
    v = (value or "").strip()
    if a == "yes" or v == "1": return "PRESENT"
    if a == "no" or v == "0": return "ABSENT"
    if "don't know" in a or "doesn't know" in a or (("field" in a) and ("know" in a)) or v == "-1": return "UNKNOWN"
    return "CATEGORICAL"


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--output", default="site/drh-catalog.json")
    ap.add_argument("--max-routed-answers", type=int, default=120000)
    args=ap.parse_args()
    z=fetch_zip()

    regions={}
    for r in csv_rows(z,"region_data.csv"):
        regions[r["region_id"]]={"name":r.get("region_name"),"world_region":r.get("world_region"),"path":r.get("path")}

    tags=defaultdict(list)
    for t in csv_rows(z,"entity_tags.csv"):
        tags[t["entry_id"]].append({"id":t.get("entrytag_id"),"name":t.get("entrytag_name"),"level":t.get("entrytag_level"),"path":t.get("entrytag_path")})

    entries=[]
    entry_names={}
    for e in csv_rows(z,"entry_data.csv"):
        eid=e["entry_id"]; entry_names[eid]=e.get("entry_name") or eid
        region=regions.get(e.get("region_id"),{})
        entries.append({
            "id":eid,"name":e.get("entry_name"),"poll_name":e.get("poll_name"),
            "year_from":e.get("year_from"),"year_to":e.get("year_to"),
            "region_id":e.get("region_id"),"region_name":region.get("name"),"world_region":region.get("world_region"),
            "data_source":e.get("data_source"),"tags":tags.get(eid,[]),
        })

    questions={}; answer_counts=Counter(); state_counts=Counter(); routed_answers=[]; route_counts=Counter(); poll_counts=Counter()
    for a in csv_rows(z,"answerset.csv"):
        qid=a["question_id"]; qname=a.get("question_name") or ""; routes=route_question(qname)
        q=questions.setdefault(qid,{"id":qid,"name":qname,"parent_question":a.get("parent_question"),"polls":set(),"answer_count":0,"routes":routes,"answer_examples":Counter()})
        q["polls"].add(a.get("poll_name") or "")
        q["answer_count"]+=1
        ans=(a.get("answer") or "").strip(); q["answer_examples"][ans]+=1
        state=norm_answer(ans,a.get("answer_value") or "")
        answer_counts[qid]+=1; state_counts[state]+=1; poll_counts[a.get("poll_name") or "UNKNOWN"]+=1
        for r in routes: route_counts[r]+=1
        if routes and len(routed_answers)<args.max_routed_answers:
            routed_answers.append({
                "entry_id":a.get("entry_id"),"entry_name":a.get("entry_name") or entry_names.get(a.get("entry_id")),
                "question_id":qid,"question_name":qname,"answer":ans,"answer_value":a.get("answer_value"),"state":state,
                "year_from":a.get("year_from"),"year_to":a.get("year_to"),"region_id":a.get("region_id"),
                "branching_question":a.get("branching_question") or None,"poll_name":a.get("poll_name"),
                "proposed_dimensions":routes,"mapping_status":"AUTO_ROUTE_REVIEW_REQUIRED",
                "source_locator":{"table":"answerset.csv","entry_id":a.get("entry_id"),"question_id":qid},
            })

    qout=[]
    for q in questions.values():
        examples=[{"answer":k,"count":v} for k,v in q.pop("answer_examples").most_common(8)]
        q["polls"]=sorted(x for x in q["polls"] if x); q["answer_examples"]=examples; qout.append(q)
    qout.sort(key=lambda x:(not bool(x["routes"]),-x["answer_count"],x["name"]))

    out={
        "dataset_id":"NOEMA-DRH-CATALOG-V1",
        "generated_at":datetime.now(timezone.utc).isoformat(),
        "status":"research-preview",
        "source":{"name":"Standard Cross-Cultural Sample of Religion / Database of Religious History","url":"https://github.com/religionhistory/SCCSR","license":"CC-BY-4.0","snapshot_note":"Upstream repository documents v1 and v2 snapshots; this importer reads the current main-branch curated archive."},
        "bias_warning":"DRH is expert-driven and unevenly sampled across traditions, time and space. Raw counts are not prevalence estimates.",
        "mapping_rule":"Question keyword routes are navigation aids only. AUTO_ROUTE_REVIEW_REQUIRED answers must not enter cross-tradition pattern scoring as NOEMA semantic facts until reviewed.",
        "summary":{"entries":len(entries),"questions":len(qout),"routed_questions":sum(1 for q in qout if q["routes"]),"routed_answers_exported":len(routed_answers),"answer_states":dict(state_counts),"poll_counts":dict(poll_counts),"route_counts":dict(route_counts)},
        "entries":entries,"questions":qout,"routed_answers":routed_answers,
    }
    p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out["summary"],indent=2))

if __name__=="__main__": main()
