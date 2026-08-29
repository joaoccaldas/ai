#!/usr/bin/env python3
from __future__ import annotations

import argparse,json
from pathlib import Path


def load(path): return json.loads(Path(path).read_text(encoding='utf-8'))


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--pulotu',default='site/religion-decomposition.json')
    ap.add_argument('--drh',default='site/drh-decomposition.json')
    ap.add_argument('--drh-catalog',default='site/drh-catalog.json')
    ap.add_argument('--dplace',default='site/dplace-religion-variables.json')
    ap.add_argument('--ontology',default='ontology/decomposition_v1.json')
    ap.add_argument('--altered',default='ontology/altered_states_v1.json')
    ap.add_argument('--pressure',default='data/candidates/discovery-pressure-2026-08-29.json')
    ap.add_argument('--output',default='site/religion-federation.json')
    a=ap.parse_args()
    p,d,dc,dp,o,alt,pressure=map(load,[a.pulotu,a.drh,a.drh_catalog,a.dplace,a.ontology,a.altered,a.pressure])
    ps,ds,dcs,dps=p['summary'],d['summary'],dc['summary'],dp['summary']
    accepted_p=ps.get('accepted_assertions',0)
    accepted_d=sum(1 for x in d['assertions'] if x.get('mapping_status')=='CURATED_CROSSWALK_V1')
    conditional_p=ps.get('conditional_assertions',0)
    conditional_d=sum(1 for x in d['assertions'] if x.get('mapping_status')=='NEEDS_REVIEW')
    out={
      'federation_id':'NOEMA-RELIGION-FEDERATION-V1',
      'release':'v1.0',
      'status':'research-preview',
      'principle':'Federate source ontologies, preserve upstream semantics, compare only explicitly crosswalked facets, and keep dependence/missingness visible.',
      'summary':{
        'source_families':3,
        'comparable_belief_system_profiles':ps['subjects']+ds['comparable_religious_groups'],
        'pulotu_profiles':ps['subjects'],
        'drh_comparable_religious_groups':ds['comparable_religious_groups'],
        'drh_context_entries_with_curated_assertions':ds['subjects']-ds['comparable_religious_groups'],
        'accepted_semantic_assertions':accepted_p+accepted_d,
        'conditional_assertions_excluded_from_profiles':conditional_p+conditional_d,
        'pulotu_raw_searchable_assertions':ps['raw_assertions'],
        'drh_total_entries':dcs['entries'],
        'drh_standardized_questions':dcs['questions'],
        'drh_total_coded_answers':dcs.get('total_answers'),
        'dplace_total_variables':dps['all_variables'],
        'dplace_religion_variable_candidates':dps['candidate_variables'],
        'discovery_pressure_candidates':len(pressure.get('candidates',[])),
        'ontology_dimensions':len(o['dimensions']),
      },
      'sources':[
        {'id':'PULOTU','role':'coded supernatural-belief/practice profiles + contact/context metadata','projection':'./religion-decomposition.json','source_digest':p['source'].get('source_digest'),'mapping_version':p['crosswalk'].get('mapping_version'),'accepted_assertions':accepted_p,'conditional_assertions':conditional_p,'raw_assertions':ps['raw_assertions']},
        {'id':'DRH','role':'expert-coded historical religious groups, places, texts and rituals','projection':'./drh-decomposition.json','catalog':'./drh-catalog.json','source_digest':d['source'].get('archive_sha256'),'mapping_version':d['crosswalk'].get('version'),'accepted_assertions':accepted_d,'conditional_assertions':conditional_d,'catalog_questions':dcs['questions']},
        {'id':'DPLACE','role':'high-recall source-variable universe for cross-cultural religion/ritual/divination context','catalog':'./dplace-religion-variables.json','source_digest':dp['source'].get('sha256'),'candidate_variables':dps['candidate_variables'],'note':'candidate-variable routing only; not semantic evidence'}
      ],
      'ontology':{'id':o['ontology_id'],'version':o['version'],'dimensions':list(o['dimensions']),'altered_states_id':alt['ontology_id'],'altered_states_version':alt['version']},
      'gates':{
        'unknown_is_absence':False,
        'raw_source_route_is_semantic_mapping':False,
        'conditional_mapping_enters_profiles':False,
        'shared_feature_implies_common_origin':False,
        'ritual_implies_psychoactive_use':False,
        'psychoactive_use_implies_religion':False,
        'experience_implies_external_ontology':False,
        'culture_change_implies_genetic_replacement':False,
      }
    }
    path=Path(a.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out['summary'],indent=2))

if __name__=='__main__':main()
