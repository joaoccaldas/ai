#!/usr/bin/env python3
"""Discover PubMed candidates for NOEMA cognition/neurophenomenology.

PubMed metadata is discovery-only. This script never creates approved evidence or
historical diagnoses. It uses NCBI E-utilities conservatively, with global
throttling, batching, retry/backoff, field-scoped queries, and a deterministic
title relevance gate to keep the human review queue high-signal.
"""
from __future__ import annotations
import argparse, json, os, re, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
MIN_REQUEST_INTERVAL=0.5
MAX_RETRIES=5
_last_request_at=0.0
TA='[Title/Abstract]'
QUERY_PACK={
 "trance_possession":f'(("trance"{TA}) OR ("spirit possession"{TA}) OR ("possession trance"{TA})) AND ((dissociation{TA}) OR (religion{TA}) OR (religious{TA}) OR (spiritual{TA}) OR (culture{TA}) OR (cultural{TA}))',
 "ecstatic_neurology":f'((ecstatic{TA}) OR (mystical{TA}) OR ("religious experience"{TA}) OR ("spiritual experience"{TA})) AND ((epilepsy{TA}) OR (seizure{TA}) OR (insula{TA}) OR ("temporal lobe"{TA}) OR (neuro*{TA}))',
 "neurodiversity_religion":f'((autism{TA}) OR (autistic{TA}) OR (ADHD{TA}) OR (neurodiversity{TA}) OR (neurodivergent{TA})) AND ((religion{TA}) OR (religiosity{TA}) OR (religious{TA}) OR (spirituality{TA}) OR (spiritual{TA}) OR (faith{TA}))',
 "sleep_visions":f'(("sleep paralysis"{TA}) OR (hypnagog*{TA}) OR (hypnopomp*{TA}) OR ("dream incubation"{TA})) AND ((religion{TA}) OR (religious{TA}) OR (spiritual{TA}) OR (supernatural{TA}) OR (spirit{TA}) OR (demon{TA}) OR (witch*{TA}))',
 "music_trance":f'((music{TA}) OR (drumming{TA}) OR (rhythm{TA}) OR (rhythmic{TA})) AND ((trance{TA}) OR ("altered state of consciousness"{TA}) OR ("non-ordinary state"{TA}) OR (ecstatic{TA}))',
 "witchcraft_psychiatry_history":f'((witchcraft{TA}) OR ("witch hunt"{TA}) OR ("witch hunts"{TA}) OR ("witch trial"{TA}) OR ("witch trials"{TA})) AND ((psychiatr*{TA}) OR ("mental illness"{TA}) OR (psycholog*{TA}) OR (hallucination{TA}) OR (dissociation{TA}))',
 "psychedelic_ritual":f'((psychedelic{TA}) OR (psilocybin{TA}) OR (ayahuasca{TA}) OR (entheogen*{TA}) OR (hallucinogen*{TA})) AND ((ritual{TA}) OR (ceremony{TA}) OR (religion{TA}) OR (religious{TA}) OR (spiritual{TA}) OR (mystical{TA}))',
}
TITLE_RULES={
 "trance_possession":[["trance","possession"],["dissociat","relig","spirit","cultur"]],
 "ecstatic_neurology":[["ecstatic","mystical","religious","spiritual"],["epilep","seizure","insula","temporal","neuro"]],
 "neurodiversity_religion":[["autism","autistic","adhd","neurodivers"],["religion","religiosity","religious","spiritual","faith"]],
 "sleep_visions":[["sleep paralysis","hypnagog","hypnopomp","dream"],["relig","spirit","supernatural","demon","witch"]],
 "music_trance":[["music","drum","rhythm"],["trance","altered state","non-ordinary","ecstatic"]],
 "witchcraft_psychiatry_history":[["witchcraft","witch hunt","witch trial"],["psychiatr","mental illness","psycholog","hallucinat","dissociat"]],
 "psychedelic_ritual":[["psychedelic","psilocybin","ayahuasca","entheogen","hallucinogen"],["ritual","ceremon","relig","spiritual","mystical"]],
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
    req=urllib.request.Request(url,headers={"User-Agent":"NOEMA research discovery/1.2"})
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

def title_relevant(title:str, query_names:list[str])->tuple[bool,list[str]]:
    normalized=re.sub(r"\s+"," ",(title or "").lower())
    passed=[]
    for name in query_names:
        groups=TITLE_RULES[name]
        if all(any(term in normalized for term in group) for group in groups):
            passed.append(name)
    return bool(passed),passed

def discover(days:int, per_query:int)->dict:
    queries_by_pmid:dict[str,list[str]]={}; query_stats={}
    for name,term in QUERY_PACK.items():
        result=get_json("esearch.fcgi",{"db":"pubmed","term":term,"retmode":"json","retmax":per_query,"sort":"pub date","datetype":"edat","reldate":days})
        ids=result.get("esearchresult",{}).get("idlist",[])
        query_stats[name]={"query":term,"pmids_returned":len(ids),"title_relevant":0}
        for pmid in ids:
            queries_by_pmid.setdefault(pmid,[]).append(name)

    seen={}; rejected=0
    all_ids=list(queries_by_pmid)
    for batch in chunks(all_ids,50):
        summary=get_json("esummary.fcgi",{"db":"pubmed","id":",".join(batch),"retmode":"json"})
        for pmid in batch:
            row=summary.get("result",{}).get(pmid,{})
            if not row: continue
            relevant,matched=title_relevant(row.get("title") or "",queries_by_pmid[pmid])
            if not relevant:
                rejected+=1
                continue
            for name in matched:
                query_stats[name]["title_relevant"]+=1
            rec={"pmid":pmid,"queries":matched,"status":"CANDIDATE_UNREVIEWED","source_family":"PUBMED","candidate_only":True,"relevance_gate":"TITLE_TWO_GROUP_MATCH"}
            rec["title"]=row.get("title")
            rec["pubdate"]=row.get("pubdate")
            rec["source"]=row.get("source")
            rec["authors"]=[a.get("name") for a in row.get("authors",[]) if a.get("name")]
            rec["articleids"]={x.get("idtype"):x.get("value") for x in row.get("articleids",[]) if x.get("idtype") and x.get("value")}
            rec["pubtypes"]=row.get("pubtype",[])
            seen[pmid]=rec

    records=sorted(seen.values(),key=lambda r:(r.get("pubdate") or "",r["pmid"]),reverse=True)
    return {"schema_version":"1.2","generated_at":datetime.now(timezone.utc).isoformat(),"status":"CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED","principle":"PubMed metadata and search relevance are not evidence. Historical diagnosis is forbidden. Relevance gates optimize review precision and do not imply evidentiary quality.","query_stats":query_stats,"records":records,"counts":{"unique_candidates":len(records),"query_count":len(QUERY_PACK),"retrieved_before_title_gate":len(all_ids),"rejected_by_title_gate":rejected,"summary_batches":sum(1 for _ in chunks(all_ids,50))}}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--days",type=int,default=30);ap.add_argument("--per-query",type=int,default=20);ap.add_argument("--output",default="projects/noema/data/candidates/pubmed-latest.json");args=ap.parse_args()
    out=discover(args.days,args.per_query);path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8");print(json.dumps(out["counts"],sort_keys=True))
if __name__=="__main__": main()
