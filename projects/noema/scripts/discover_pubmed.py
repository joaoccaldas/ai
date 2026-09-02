#!/usr/bin/env python3
"""Discover PubMed candidates for NOEMA cognition/neurophenomenology.

PubMed metadata is discovery-only. This script never creates approved evidence or
historical diagnoses. It uses NCBI E-utilities and stays below unauthenticated
rate limits by issuing a small number of batched requests.
"""
from __future__ import annotations
import argparse, json, os, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
QUERY_PACK={
 "trance_possession":"(trance OR possession) AND (dissociation OR culture OR religion)",
 "ecstatic_neurology":"(ecstatic OR mystical OR religious experience) AND (epilepsy OR insula OR temporal lobe)",
 "neurodiversity_religion":"(autism OR ADHD OR neurodiversity) AND (religion OR spirituality OR ritual)",
 "sleep_visions":"(sleep paralysis OR hypnagogia OR dreaming) AND (religion OR supernatural OR spiritual)",
 "music_trance":"(music OR drumming OR rhythm) AND (trance OR altered state) AND (neuroscience OR cognition)",
 "witchcraft_psychiatry_history":"witchcraft AND (psychiatry OR mental illness OR psychology) AND history",
 "psychedelic_ritual":"(psychedelic OR entheogen OR hallucinogen) AND (ritual OR religion OR spirituality)",
}

def get_json(endpoint:str, params:dict)->dict:
    params={**params,"tool":"NOEMA","email":os.getenv("NCBI_EMAIL","noema-research@example.invalid")}
    url=BASE+endpoint+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={"User-Agent":"NOEMA research discovery/1.0"})
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.load(r)

def discover(days:int, per_query:int)->dict:
    seen={}; query_stats={}
    for name,term in QUERY_PACK.items():
        result=get_json("esearch.fcgi",{"db":"pubmed","term":term,"retmode":"json","retmax":per_query,"sort":"pub date","datetype":"edat","reldate":days})
        ids=result.get("esearchresult",{}).get("idlist",[])
        query_stats[name]={"query":term,"pmids":len(ids)}
        if ids:
            summary=get_json("esummary.fcgi",{"db":"pubmed","id":",".join(ids),"retmode":"json"})
            for pmid in ids:
                row=summary.get("result",{}).get(pmid,{})
                if not row: continue
                rec=seen.setdefault(pmid,{"pmid":pmid,"queries":[],"status":"CANDIDATE_UNREVIEWED","source_family":"PUBMED","candidate_only":True})
                rec["queries"].append(name)
                rec["title"]=row.get("title")
                rec["pubdate"]=row.get("pubdate")
                rec["source"]=row.get("source")
                rec["authors"]=[a.get("name") for a in row.get("authors",[]) if a.get("name")]
                rec["articleids"]={x.get("idtype"):x.get("value") for x in row.get("articleids",[]) if x.get("idtype") and x.get("value")}
                rec["pubtypes"]=row.get("pubtype",[])
        time.sleep(0.4)
    records=sorted(seen.values(),key=lambda r:(r.get("pubdate") or "",r["pmid"]),reverse=True)
    return {"schema_version":"1.0","generated_at":datetime.now(timezone.utc).isoformat(),"status":"CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED","principle":"PubMed metadata and search relevance are not evidence. Historical diagnosis is forbidden.","query_stats":query_stats,"records":records,"counts":{"unique_candidates":len(records),"query_count":len(QUERY_PACK)}}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--days",type=int,default=30);ap.add_argument("--per-query",type=int,default=20);ap.add_argument("--output",default="projects/noema/data/candidates/pubmed-latest.json");args=ap.parse_args()
    out=discover(args.days,args.per_query);path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8");print(json.dumps(out["counts"],sort_keys=True))
if __name__=="__main__": main()
