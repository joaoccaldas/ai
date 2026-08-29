#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


def pct(num: float, den: float) -> float:
    return round((num / den) * 100, 2) if den else 0.0


def load(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--federation", default="site/religion-federation.json")
    ap.add_argument("--pulotu", default="site/religion-decomposition.json")
    ap.add_argument("--drh", default="site/drh-decomposition.json")
    ap.add_argument("--dplace", default="site/dplace-religion-variables.json")
    ap.add_argument("--catalog", default="data/reference/belief-catalog-v1.json")
    ap.add_argument("--patterns", default="site/pattern-candidates.json")
    ap.add_argument("--output", default="site/research-health.json")
    args = ap.parse_args()
    f, p, d, dp, cat, pat = map(load, [args.federation, args.pulotu, args.drh, args.dplace, args.catalog, args.patterns])
    ps, ds, fs = p["summary"], d["summary"], f["summary"]
    entities = cat.get("entities") or []
    deity_like = [e for e in entities if e.get("kind") in {"DEITY", "SPIRIT", "SUPERNATURAL_AGENT"}]
    approved_media = sum(1 for e in entities for m in (e.get("media") or []) if m.get("rights_status") == "APPROVED")
    drh_groups = {s["id"] for s in d.get("subjects", []) if s.get("comparable_belief_system")}
    drh_groups_mapped = {a["subject_id"] for a in d.get("assertions", []) if a.get("subject_id") in drh_groups and a.get("mapping_status") == "CURATED_CROSSWALK_V1"}
    cohort_counts = {c["source"]: len(c.get("candidates") or []) for c in pat.get("cohorts") or []}
    metrics = {"source_families": fs["source_families"], "comparable_profiles": fs["comparable_belief_system_profiles"], "accepted_semantic_assertions": fs["accepted_semantic_assertions"], "ontology_dimensions": fs["ontology_dimensions"], "pulotu_mapping_coverage_pct": pct(ps["accepted_assertions"], ps["assertions"]), "drh_question_mapping_coverage_pct": pct(ds["mapped_questions"], ds["questions"]), "drh_comparable_groups_with_any_curated_mapping_pct": pct(len(drh_groups_mapped), len(drh_groups)), "dplace_religion_variable_candidates": dp["summary"]["candidate_variables"], "reference_entities": len(entities), "deity_spirit_reference_entities": len(deity_like), "approved_media_assets": approved_media, "pattern_candidates_pulotu": cohort_counts.get("PULOTU", 0), "pattern_candidates_drh": cohort_counts.get("DRH", 0)}
    blind_spots = [
      {"severity":"CRITICAL","area":"causal inference","finding":"Pattern screening does not yet control for phylogeny, spatial autocorrelation, known contact, source dependence, research intensity, or missing-data mechanisms.","next_gate":"Require phylogenetic/spatial/contact-aware models before any relationship can be promoted beyond descriptive candidate status."},
      {"severity":"HIGH","area":"DRH semantic coverage","finding":f"Only {ds['mapped_questions']} of {ds['questions']} standardized DRH questions have curated NOEMA crosswalks ({metrics['drh_question_mapping_coverage_pct']}%).","next_gate":"Expand mappings in reviewed thematic batches with semantic-drift tests; never use keyword auto-mapping as evidence."},
      {"severity":"HIGH","area":"D-PLACE integration","finding":f"{dp['summary']['candidate_variables']} religion/ritual/divination-related D-PLACE variables are routed for review but are not accepted semantic assertions.","next_gate":"Review and crosswalk high-value variables, preserving upstream variable IDs and licensing."},
      {"severity":"HIGH","area":"runtime database","finding":"The repository schema is richer than the currently verified deployed database state; static federation files remain the operational public source of truth.","next_gate":"Apply and verify all migrations on the runtime database, then publish DB-backed projections through the read-only API."},
      {"severity":"MEDIUM","area":"semantic retrieval","finding":"Global search is ontology-expanded lexical retrieval, not a calibrated hybrid vector + metadata search.","next_gate":"Publish versioned embeddings or a deterministic semantic index with model/version metadata and lexical fallback."},
      {"severity":"MEDIUM","area":"entity resolution","finding":f"The reference layer currently has {len(deity_like)} deity/spirit/agent cards, far below the target needed for global deity-level coverage.","next_gate":"Add authority IDs, multilingual names, historical variants, source-specific identities, and reviewed merge/split decisions."},
      {"severity":"MEDIUM","area":"media","finding":f"{approved_media} media assets currently pass an explicit rights-status gate in the reference catalog.","next_gate":"Add a Commons/museum media adapter that stores creator, license, source page, media URL, rights status, caption, alt text, and entity linkage before display."}
    ]
    out = {"report_id":"NOEMA-RESEARCH-HEALTH-V1","status":"ENGINEERING_AND_EPISTEMIC_AUDIT","metrics":metrics,"strengths":["Source digests and upstream locators are preserved in generated federation products.","Reference identity profiles are separated from evidence claims.","Unknown, absent, contested, and conditional mappings are not silently collapsed.","Pulotu and DRH remain separate statistical cohorts.","Crosswalks include semantic-drift guards for curated DRH questions.","Public projections are generated deterministically and validated in CI."],"blind_spots":blind_spots,"maturity":{"data_provenance":"STRONG","ontology":"STRONG_BUT_EXPANDING","source_coverage":"MEDIUM","semantic_mapping_coverage":"EARLY_TO_MEDIUM","entity_resolution":"EARLY","pattern_screening":"MEDIUM_DESCRIPTIVE","causal_relationship_inference":"EARLY","simulation":"EARLY","runtime_database_activation":"UNVERIFIED","media_and_visual_provenance":"EARLY","public_ui":"MEDIUM"},"policy":"This health report is an engineering/research-readiness audit, not a scientific confidence score."}
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
