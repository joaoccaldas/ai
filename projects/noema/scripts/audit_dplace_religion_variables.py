#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import urllib.request
from collections import Counter
from pathlib import Path

URL='https://raw.githubusercontent.com/D-PLACE/dplace-cldf/v3.3.0/cldf/variables.csv'
KEYWORDS={
 'AGENCY_ONTOLOGY':['god','deity','supernatural','spirit','ancestor','demon','ghost'],
 'DEATH_AFTERLIFE':['afterlife','after death','soul','burial','funeral','mortuary','cremation','dead'],
 'RITUAL_GRAMMAR':['ritual','sacrifice','offering','prayer','initiation','fasting','pilgrimage','ceremony','ceremonial','chant','dance','drumming'],
 'ALTERED_STATE_INDUCTION':['trance','ecstatic','possession','hallucinogen','hallucinatory','psychoactive','intoxicant','dream','meditation','fasting','drumming'],
 'CAUSALITY_DIVINATION':['divination','oracle','omen','astrology','astrological','magic','witch','sorcery','sorcerer','mediumship'],
 'MORAL_ORDER':['punish','moral','taboo','purity','pollution','sin'],
 'NATURE_RELATION':['animism','nature spirit','sacred landscape','weather spirit','animal spirit','plant spirit'],
 'RELIGIOUS_SPECIALISTS':['shaman','priest','diviner','mediumship','healer','religious specialist'],
 'SACREDNESS':['sacred','holy','shrine','temple','relic','pilgrimage'],
}


def fetch():
    req=urllib.request.Request(URL,headers={'User-Agent':'NOEMA/1.0 (+https://github.com/joaoccaldas/ai)'})
    with urllib.request.urlopen(req,timeout=120) as r:
        return r.read().decode('utf-8-sig')


def term_hit(text: str, term: str) -> bool:
    if ' ' in term:
        return term in text
    return re.search(rf'(?<![a-z]){re.escape(term)}[a-z]*(?![a-z])', text) is not None


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',default='data/source_catalog/dplace-religion-variables.json');args=ap.parse_args()
    source_text=fetch(); rows=list(csv.DictReader(io.StringIO(source_text)))
    hits=[];contrib=Counter();routes=Counter()
    for r in rows:
        text=' '.join(str(r.get(k) or '') for k in ('Name','Description','category','source_comment','comment')).lower()
        term_matches={dim:[term for term in keys if term_hit(text,term)] for dim,keys in KEYWORDS.items()}
        term_matches={dim:terms for dim,terms in term_matches.items() if terms}
        matched=sorted(term_matches)
        if not matched: continue
        contrib[r.get('Contribution_ID') or 'UNKNOWN']+=1
        for d in matched:routes[d]+=1
        hits.append({
            'id':r.get('ID'),'name':r.get('Name'),'description':r.get('Description'),'category':r.get('category'),
            'type':r.get('type'),'unit':r.get('unit'),'contribution_id':r.get('Contribution_ID'),
            'candidate_dimensions':matched,'matched_terms':term_matches,'mapping_status':'SOURCE_VARIABLE_CANDIDATE'
        })
    hits.sort(key=lambda x:(x['contribution_id'] or '',x['name'] or ''))
    out={
        'catalog_id':'NOEMA-DPLACE-RELIGION-VARIABLE-AUDIT-V1',
        'source':{'url':URL,'version':'v3.3.0','sha256':hashlib.sha256(source_text.encode('utf-8')).hexdigest()},
        'routing':{'method':'high_recall_keyword_audit','keyword_sha256':hashlib.sha256(json.dumps(KEYWORDS,sort_keys=True,separators=(',',':')).encode()).hexdigest()},
        'status':'SOURCE_VARIABLE_CANDIDATES_NOT_EVIDENCE',
        'rule':'Keyword routing discovers candidate source variables only; each variable definition and coding scheme requires review before NOEMA semantic mapping. False positives are expected and retained for auditability.',
        'summary':{'all_variables':len(rows),'candidate_variables':len(hits),'by_contribution':dict(contrib),'by_candidate_dimension':dict(routes)},
        'variables':hits
    }
    p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out['summary'],indent=2))
if __name__=='__main__':main()
