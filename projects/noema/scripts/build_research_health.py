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
    ap.add_argument("--ontology", default="ontology/decomposition_v1.json")
    ap.add_argument("--patterns", default="site/pattern-candidates.json")
    ap.add_argument("--coverage", default="site/coverage-matrix.json")
    ap.add_argument("--source-dependence", default="site/source-dependence.json")
    ap.add_argument("--pubmed", default="data/candidates/pubmed-latest.json")
    ap.add_argument("--output", default="site/research-health.json")
    args = ap.parse_args()
    f, p, d, dp, cat, onto, pat, cov = map(load, [args.federation, args.pulotu, args.drh, args.dplace, args.catalog, args.ontology, args.patterns, args.coverage])
    dep = load(args.source_dependence) if Path(args.source_dependence).exists() else {"counts": {}, "edges": []}
    pubmed = load(args.pubmed) if Path(args.pubmed).exists() else {"counts": {}, "query_stats": {}}
    ps, ds, fs = p["summary"], d["summary"], f["summary"]
    entities = cat.get("entities") or []
    deity_like = [e for e in entities if e.get("kind") in {"DEITY", "SPIRIT", "SUPERNATURAL_AGENT"}]
    approved_media = sum(1 for e in entities for m in (e.get("media") or []) if m.get("rights_status") == "APPROVED")
    drh_groups = {s["id"] for s in d.get("subjects", []) if s.get("comparable_belief_system")}
    drh_groups_mapped = {a["subject_id"] for a in d.get("assertions", []) if a.get("subject_id") in drh_groups and a.get("mapping_status") == "CURATED_CROSSWALK_V1"}
    cohort_counts = {c["source"]: len(c.get("candidates") or []) for c in pat.get("cohorts") or []}
    canonical_dims = set((onto.get("dimensions") or {}).keys())
    reference_dim_keys = {k for e in entities for k in (e.get("dimensions") or {}).keys()}
    noncanonical_reference_dims = sorted(reference_dim_keys - canonical_dims)
    coverage_by_source = {s["source"]: s for s in cov.get("sources") or []}
    dep_counts = dep.get("counts") or {}
    pub_counts = pubmed.get("counts") or {}
    metrics = {
        "source_families": fs["source_families"],
        "comparable_profiles": fs["comparable_belief_system_profiles"],
        "accepted_semantic_assertions": fs["accepted_semantic_assertions"],
        "ontology_dimensions": fs["ontology_dimensions"],
        "pulotu_mapping_coverage_pct": pct(ps["accepted_assertions"], ps["assertions"]),
        "drh_question_mapping_coverage_pct": pct(ds["mapped_questions"], ds["questions"]),
        "drh_comparable_groups_with_any_curated_mapping_pct": pct(len(drh_groups_mapped), len(drh_groups)),
        "dplace_religion_variable_candidates": dp["summary"]["candidate_variables"],
        "reference_entities": len(entities),
        "deity_spirit_reference_entities": len(deity_like),
        "reference_noncanonical_dimension_keys": len(noncanonical_reference_dims),
        "approved_media_assets": approved_media,
        "pattern_candidates_pulotu": cohort_counts.get("PULOTU", 0),
        "pattern_candidates_drh": cohort_counts.get("DRH", 0),
        "pulotu_dimensions_with_binary_coverage": sum(r["profiles_with_explicit_binary_state"] > 0 for r in coverage_by_source.get("PULOTU", {}).get("rows", [])),
        "drh_dimensions_with_binary_coverage": sum(r["profiles_with_explicit_binary_state"] > 0 for r in coverage_by_source.get("DRH", {}).get("rows", [])),
        "source_fingerprints_encoded": dep_counts.get("sources", 0),
        "source_dependency_edges_encoded": dep_counts.get("dependency_edges", 0),
        "source_independence_groups_encoded": dep_counts.get("independence_groups", 0),
        "pubmed_latest_candidates": pub_counts.get("unique_candidates", 0),
        "pubmed_latest_queries": pub_counts.get("query_count", 0),
        "pubmed_rejected_by_relevance_gate": pub_counts.get("rejected_by_title_gate", 0),
    }
    blind_spots = [
      {"severity":"CRITICAL","area":"causal inference","finding":"Pattern screening does not yet control for phylogeny, spatial autocorrelation, known contact, research intensity, or richer missing-data mechanisms. A source-dependence graph now exists, but current pattern candidates do not yet consume it.","next_gate":"Make source-dependence groups an analysis input, then require phylogenetic/spatial/contact-aware models plus missing-data sensitivity before any relationship can be promoted beyond descriptive candidate status."},
      {"severity":"HIGH","area":"source independence coverage","finding":f"The v1.8 source-dependence graph currently fingerprints {dep_counts.get('sources',0)} sources and encodes {dep_counts.get('dependency_edges',0)} blocking dependency edges. Absence of an edge is explicitly not proof of independence.","next_gate":"Fingerprint every source entering promoted claims/tests with exact dataset snapshots, samples/cohorts and parent/derived relationships; link systematic reviews to included primary-study families."},
      {"severity":"HIGH","area":"DRH semantic coverage","finding":f"Only {ds['mapped_questions']} of {ds['questions']} standardized DRH questions have curated NOEMA crosswalks ({pct(ds['mapped_questions'], ds['questions'])}%).","next_gate":"Expand mappings in reviewed thematic batches with semantic-drift tests; never use keyword auto-mapping as evidence."},
      {"severity":"HIGH","area":"D-PLACE integration","finding":f"{dp['summary']['candidate_variables']} religion/ritual/divination-related D-PLACE variables are routed for review but are not accepted semantic assertions.","next_gate":"Review and crosswalk high-value variables, preserving upstream variable IDs and licensing."},
      {"severity":"HIGH","area":"reference taxonomy","finding":f"The starter reference catalog still contains {len(noncanonical_reference_dims)} pre-v1 dimension keys ({', '.join(noncanonical_reference_dims[:8]) or 'none'}). These are discovery tags, not accepted comparative ontology.","next_gate":"Publish a normalized reference projection that preserves legacy tags for search but exposes comparative dimensions only after explicit canonical crosswalk review."},
      {"severity":"HIGH","area":"runtime database","finding":"Repository migrations now model datasets, feature assertions, analyses, relationship candidates, identity names/links and media review, but the deployed runtime database is not yet verified at this schema level.","next_gate":"Apply and verify migrations 001-006 on the runtime database, then publish DB-backed projections through the read-only API."},
      {"severity":"MEDIUM","area":"biomedical transportability","finding":f"PubMed discovery is operational ({pub_counts.get('query_count',0)} query families in the latest run, {pub_counts.get('unique_candidates',0)} retained candidates), but biomedical studies remain candidate mechanism/context sources and cannot be projected into historical populations.","next_gate":"Review underlying papers, fingerprint samples/datasets, and require explicit phenomenology/cultural-role bridge evidence before cross-domain hypothesis testing."},
      {"severity":"MEDIUM","area":"semantic retrieval","finding":"Global search is ontology-expanded lexical retrieval, not a calibrated hybrid vector + metadata search.","next_gate":"Publish versioned embeddings or a deterministic semantic index with model/version metadata and lexical fallback."},
      {"severity":"MEDIUM","area":"entity resolution","finding":f"The reference layer currently has {len(deity_like)} deity/spirit/agent cards and no verified authority-link coverage metric yet.","next_gate":"Add authority IDs, multilingual names, historical variants, source-specific identities, and reviewed merge/split decisions through migration 006."},
      {"severity":"MEDIUM","area":"media","finding":f"{approved_media} media assets currently pass an explicit rights-status gate in the reference catalog.","next_gate":"Use the Commons candidate adapter to stage creator/license/source metadata, then require separate identity and rights approval before public rendering."}
    ]
    out = {
        "report_id":"NOEMA-RESEARCH-HEALTH-V1",
        "status":"ENGINEERING_AND_EPISTEMIC_AUDIT",
        "metrics":metrics,
        "strengths":[
            "Source digests and upstream locators are preserved in generated federation products.",
            "Reference identity profiles are separated from evidence claims.",
            "Unknown, absent, contested, uncoded and missing states are not silently collapsed in the v1 pattern engine.",
            "Crosswalk-dependent feature pairs are removed from pattern testing.",
            "Pulotu and DRH remain separate statistical cohorts.",
            "Crosswalks include semantic-drift guards for curated DRH questions.",
            "A versioned source-dependence primitive now distinguishes same-work, derived, shared-dataset and shared-sample families without treating author overlap or citations as dependence.",
            "PubMed/MEDLINE discovery is isolated as a candidate mechanism/context channel with anti-retrodiagnosis guardrails.",
            "Public projections are generated deterministically and validated in CI."
        ],
        "blind_spots":blind_spots,
        "maturity":{
            "data_provenance":"STRONG",
            "ontology":"STRONG_BUT_EXPANDING",
            "source_coverage":"MEDIUM_EXPANDING",
            "source_dependence":"EARLY_OPERATIONAL",
            "semantic_mapping_coverage":"EARLY_TO_MEDIUM",
            "entity_resolution":"EARLY",
            "pattern_screening":"MEDIUM_DESCRIPTIVE",
            "causal_relationship_inference":"EARLY",
            "biocultural_cognition":"EARLY_GUARDED_DISCOVERY",
            "simulation":"EARLY",
            "runtime_database_activation":"UNVERIFIED",
            "media_and_visual_provenance":"EARLY_WITH_STAGING_PIPELINE",
            "public_ui":"MEDIUM"
        },
        "policy":"This health report is an engineering/research-readiness audit, not a scientific confidence score."
    }
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
