#!/usr/bin/env python3
"""Discover PubMed candidates for NOEMA cognition/neurophenomenology.

PubMed metadata is discovery-only. This script never creates approved evidence or
historical diagnoses. It uses NCBI E-utilities conservatively, with global
throttling, batching, and retry/backoff for transient rate limiting.
"""
from __future__ import annotations
import argparse, json, os, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
MIN_REQUEST_INTERVAL=0.5
MAX_RETRIES=5
_last_request_at=0.0
QUERY_PACK={
 "trance_possession":"(trance OR possession) AND (dissociation OR culture OR religion)",
 "ecstatic_neurology":"(ecstatic OR mystical OR religious experience) AND (epilepsy OR insula OR temporal lobe)",
 "neurodiversity_religion":"(autism OR ADHD OR neurodiversity) AND (religion OR spirituality OR ritual)",
 "sleep_visions":"(sleep paralysis OR hypnagogia OR dreaming) AND (religion OR supernatural OR spiritual)",
 "music_trance":"(music OR drumming OR rhythm) AND (trance OR altered state) AND (neuroscience OR cognition)",
 "witchcraft_psychiatry_history":"witchcraft AND (psychiatry OR mental illness OR psychology) AND history",
 "psychedelic_ritual":"(psychedelic OR entheogen OR hallucinogen) AND (ritual OR religion OR spirituality)",
}

def _throttle()->None:
    global _last_request_at
    elapsed=time.monotonic()-_last_request_at
    if elapsed<MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL-elapsed)
    _last_request_at=time.monotonic()

def get_json(endpoint:str, params:dict)->dict:
    email=os.getenv("NCBI_EMAIL") or "noema-research@example.invalid"
    params={**params,"tool":"NOEMA","email":email}
    url=BASE+endpoint+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={"User-Agent":"NOEMA research discovery/1.1"})
    for attempt in range(MAX_RETRIES):
        _throttle()
        try:
            with urllib.request.urlopen(req,timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code not in {429,500,502,503,504} or attempt==MAX_RETRIES-1:
                raise
            retry_after=exc.headers.get("Retry-After") if exc.headers else None
            try:
                delay=float(retry_after) if retry_after else 2**attempt
            except ValueError:
                delay=2**attempt
            time.sleep(max(1.0,min(delay,30.0)))
    raise RuntimeError("unreachable")

def chunks(items:list[str], size:int=50):
    for i in range(0,len(items),size):
        yield items[i:i+size]

def discover(days:int, per_query:int)->dict:
    queries_by_pmid:dict[str,list[str]]={}; query_stats={}
    for name,term in QUERY_PACK.items():
        result=get_json("esearch.fcgi",{"db":"pubmed","term":term,"retmode":"json","retmax":per_query,"sort":"pub date","datetype":"edat","reldate":days})
        ids=result.get("esearchresult",{}).get("idlist",[])
        query_stats[name]={"query":term,"pmids":len(ids)}
        for pmid in ids:
            queries_by_pmid.setdefault(pmid,[]).append(name)

    seen={}
    all_ids=list(queries_by_pmid)
    for batch in chunks(all_ids,50):
        summary=get_json("esummary.fcgi",{"db":"pubmed","id":",".join(batch),"retmode":"json"})
        for pmid in batch:
            row=summary.get("result",{}).get(pmid,{})
            if not row: continue
            rec={"pmid":pmid,"queries":queries_by_pmid[pmid],"status":"CANDIDATE_UNREVIEWED","source_family":"PUBMED","candidate_only":True}
            rec["title"]=row.get("title")
            rec["pubdate"]=row.get("pubdate")
            rec["source"]=row.get("source")
            rec["authors"]=[a.get("name") for a in row.get("authors",[]) if a.get("name")]
            rec["articleids"]={x.get("idtype"):x.get("value") for x in row.get("articleids",[]) if x.get("idtype") and x.get("value")}
            rec["pubtypes"]=row.get("pubtype",[])
            seen[pmid]=rec

    records=sorted(seen.values(),key=lambda r:(r.get("pubdate") or "",r["pmid"]),reverse=True)
    return {"schema_version":"1.1","generated_at":datetime.now(timezone.utc).isoformat(),"status":"CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED","principle":"PubMed metadata and search relevance are not evidence. Historical diagnosis is forbidden.","query_stats":query_stats,"records":records,"counts":{"unique_candidates":len(records),"query_count":len(QUERY_PACK),"summary_batches":sum(1 for _ in chunks(all_ids,50))}}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--days",type=int,default=30);ap.add_argument("--per-query",type=int,default=20);ap.add_argument("--output",default="projects/noema/data/candidates/pubmed-latest.json");args=ap.parse_args()
    out=discover(args.days,args.per_query);path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8");print(json.dumps(out["counts"],sort_keys=True))
if __name__=="__main__": main()
