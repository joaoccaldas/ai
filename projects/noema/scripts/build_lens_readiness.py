#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'

MAP={
 'belief':['AGENCY_ONTOLOGY','DEATH_AFTERLIFE','COSMOLOGY','MORAL_ORDER','SACREDNESS'],
 'ritual':['RITUAL_GRAMMAR','RELIGIOUS_SPECIALISTS','TRANSMISSION'],
 'mortuary':['DEATH_AFTERLIFE','MATERIAL_AND_SPACE'],
 'altered':['ALTERED_STATE_INDUCTION','EXPERIENCE_PHENOMENOLOGY'],
 'environment':['NATURE_RELATION'],
}

def load(p): return json.loads(p.read_text())
def mean(xs): return round(sum(xs)/len(xs),2) if xs else 0.0

def main():
    cov=load(SITE/'coverage-matrix.json'); base=load(SITE/'lens-readiness-v1.json')
    bysrc={s['source']:{r['dimension']:r for r in s['rows']} for s in cov['sources']}
    out={'schema_version':'2.0','status':'DERIVED_PUBLIC_READINESS','principle':'Readiness is computed from observable corpus/model gates. It is not historical truth, claim confidence, importance, or causal evidence.','generated_from':['coverage-matrix.json','lens-readiness-v1.json'],'lenses':{}}
    for key,spec in base['lenses'].items():
        dims=MAP.get(key,[]); metrics={}
        for src,rows in bysrc.items(): metrics[src]={'semantic_coverage_pct':mean([rows[d]['profile_semantic_coverage_pct'] for d in dims if d in rows]),'binary_coverage_pct':mean([rows[d]['profile_binary_coverage_pct'] for d in dims if d in rows])}
        blockers=list(spec['missing']); readiness=spec['readiness']; public=spec['public_use']
        # Only comparative belief/ritual/mortuary readiness can be upgraded from current matrix.
        # Other lenses require dedicated model/data gates not represented by this matrix.
        if key in {'belief','ritual','mortuary'} and dims:
            strongest=max((m['semantic_coverage_pct'] for m in metrics.values()),default=0)
            independent=sum(m['semantic_coverage_pct']>=25 for m in metrics.values())
            if strongest>=60 and independent>=2 and len(blockers)<=1: readiness='ANALYSIS_READY'
            elif strongest>=40: readiness='PARTIAL_STRONG_EXAMPLES' if key=='mortuary' else 'PARTIAL'
        out['lenses'][key]={**spec,'readiness':readiness,'public_use':public,'derived_metrics':metrics,'promotion_gate':{'automatic':False,'rule':'A lens can advance only when required source, semantic, chronology/geography and model gates are represented by auditable inputs.'}}
    (SITE/'lens-readiness-derived-v2.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({k:v['readiness'] for k,v in out['lenses'].items()},indent=2))
if __name__=='__main__': main()
