from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


search_mod = load_module("build_search_index_v18", ROOT / "scripts/build_search_index_v18.py")
compare_mod = load_module("build_compare_index_v18", ROOT / "scripts/build_compare_index_v18.py")


def test_compact_index_projects_search_metadata_without_evidence_payload(tmp_path: Path) -> None:
    source = tmp_path / "sample.json"
    source.write_text(json.dumps({
        "entities": [{
            "id": "GOD-TEST",
            "kind": "DEITY",
            "name": "Test Deity",
            "aliases": ["Test Alias"],
            "regions": ["Test Region"],
            "dimensions": {"ONTOLOGY_AGENCY": ["DEITY"], "RITUAL_GRAMMAR": ["OFFERING"]},
            "sources": [{"quote": "large claim evidence must not enter the search projection"}],
            "profile_status": "REFERENCE_ONLY",
        }]
    }), encoding="utf-8")
    built = search_mod.build([source])
    assert built["projection"] == "NOEMA_COMPACT_SEARCH_V18"
    assert built["counts"]["records"] == 1
    assert len(built["source_fingerprint"]) == 64
    record = built["records"][0]
    assert record["id"] == "GOD-TEST"
    assert "OFFERING" in record["components"]
    assert "sources" not in record
    assert "claim" not in record
    assert "evidence" not in record


def test_compact_projection_build_is_deterministic(tmp_path: Path) -> None:
    source = tmp_path / "sample.json"
    source.write_text(json.dumps({"entities": [{"id": "GOD-X", "name": "X", "kind": "DEITY"}]}), encoding="utf-8")
    assert search_mod.build([source]) == search_mod.build([source])


def test_compact_compare_projection_preserves_only_accepted_present_mappings(tmp_path: Path) -> None:
    catalog = tmp_path / "catalog.json"
    pulotu = tmp_path / "pulotu.json"
    drh = tmp_path / "drh.json"
    catalog.write_text(json.dumps({"entities": [{
        "id": "GOD-TEST", "name": "Test Deity", "kind": "DEITY",
        "dimensions": {"ONTOLOGY_AGENCY": ["DEITY"]},
        "sources": [{"quote": "claim-level evidence must stay out"}],
    }]}), encoding="utf-8")
    pulotu.write_text(json.dumps({
        "subjects": [{"id": 1, "name": "Pulotu Test"}],
        "assertions": [
            {"subject_id": 1, "state": "PRESENT", "mapping_status": "EXPLICIT_V1", "dimension": "RITUAL_GRAMMAR", "facet": "OFFERING"},
            {"subject_id": 1, "state": "ABSENT", "mapping_status": "EXPLICIT_V1", "dimension": "RITUAL_GRAMMAR", "facet": "SACRIFICE"},
            {"subject_id": 1, "state": "PRESENT", "mapping_status": "RAW_ONLY", "dimension": "COSMOLOGY_STRUCTURE", "facet": "WORLD_TREE"},
        ],
    }), encoding="utf-8")
    drh.write_text(json.dumps({
        "subjects": [{"id": "DRH:1", "name": "DRH Test", "comparable_belief_system": True, "world_region": "Test Region"}],
        "assertions": [
            {"subject_id": "DRH:1", "state": "PRESENT", "mapping_status": "CURATED_CROSSWALK_V1", "dimension": "MORTALITY_DEATH", "facet": "AFTERLIFE"},
            {"subject_id": "DRH:1", "state": "UNKNOWN", "mapping_status": "CURATED_CROSSWALK_V1", "dimension": "RITUAL_GRAMMAR", "facet": "PRAYER"},
        ],
    }), encoding="utf-8")

    built = compare_mod.build(catalog, pulotu, drh)
    assert built["projection"] == "NOEMA_COMPACT_COMPARE_V18"
    assert built["counts"]["records"] == 3
    assert built["counts"]["source_families"] == 3
    assert len(built["source_fingerprint"]) == 64
    by_id = {r["id"]: r for r in built["records"]}
    assert by_id["PULOTU:1"]["dimensions"] == {"RITUAL_GRAMMAR": ["OFFERING"]}
    assert by_id["DRH:1"]["dimensions"] == {"MORTALITY_DEATH": ["AFTERLIFE"]}
    assert "sources" not in by_id["GOD-TEST"]
    assert "assertions" not in by_id["DRH:1"]
    assert built == compare_mod.build(catalog, pulotu, drh)


def test_explore_does_not_load_heavy_global_runtime() -> None:
    html = (ROOT / "site/explore.html").read_text(encoding="utf-8")
    assert "explore-v18.js" in html
    assert "shell-v18.js" in html
    assert "app-v1.js" not in html
    assert "drh-decomposition.json" not in html
    assert "religion-decomposition.json" not in html


def test_explore_client_has_compact_index_and_safe_fallback() -> None:
    js = (ROOT / "site/explore-v18.js").read_text(encoding="utf-8")
    assert "search-index-v18.json" in js
    assert "belief-catalog-v1.json" in js
    assert "Search similarity does not establish shared origin" in js


def test_entity_workspace_does_not_load_heavy_global_runtime() -> None:
    html = (ROOT / "site/entity.html").read_text(encoding="utf-8")
    assert "shell-v18.js" in html
    assert "entity-v18.js" in html
    assert "foundation-v18.css" in html
    assert "app-v1.js" not in html
    assert "entity-v2.js" not in html
    assert "entity-depth-v14.js" not in html
    assert "synoptic-v15.js" not in html
    assert "drh-decomposition.json" not in html
    assert "religion-decomposition.json" not in html


def test_entity_client_loads_only_reference_identity_before_optional_media() -> None:
    js = (ROOT / "site/entity-v18.js").read_text(encoding="utf-8")
    assert "belief-catalog-v1.json" in js
    assert "decomposition_v1.json" in js
    assert "requestIdleCallback" in js
    assert "museum-reference-media.json" in js
    assert "media-reviewed-v1.json" in js
    assert "drh-decomposition.json" not in js
    assert "religion-decomposition.json" not in js
    assert "cache:'no-store'" not in js
    assert "Similarity, graph proximity and shared components do not establish descent, diffusion or causation" in js


def test_entity_media_is_reference_only_and_failure_isolated() -> None:
    js = (ROOT / "site/entity-v18.js").read_text(encoding="utf-8")
    assert "reference depiction, not evidence" in js
    assert "Identity and evidence remain unaffected" in js
    assert "REFERENCE_ONLY_NOT_EVIDENCE" in js
    assert "REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY" in js


def test_compare_does_not_load_heavy_global_runtime() -> None:
    html = (ROOT / "site/compare.html").read_text(encoding="utf-8")
    assert "shell-v18.js" in html
    assert "compare-v18.js" in html
    assert "foundation-v18.css" in html
    assert "app-v1.js" not in html
    assert "drh-decomposition.json" not in html
    assert "religion-decomposition.json" not in html
    assert "Same words do not mean same history." in html


def test_compare_client_uses_compact_projection_and_preserves_uncertainty() -> None:
    js = (ROOT / "site/compare-v18.js").read_text(encoding="utf-8")
    assert "compare-index-v18.json" in js
    assert "drh-decomposition.json" not in js
    assert "religion-decomposition.json" not in js
    assert "cache:'no-store'" not in js
    assert "unknown / uncoded" in js
    assert "Unknown / uncoded is not absence." in js
    assert "Shared coding does not establish equivalent meaning, descent, diffusion, contact or causation." in js
    assert "concept.html?term=" in js


def test_accessibility_foundation_is_wired() -> None:
    explore = (ROOT / "site/explore.html").read_text(encoding="utf-8")
    entity = (ROOT / "site/entity.html").read_text(encoding="utf-8")
    compare = (ROOT / "site/compare.html").read_text(encoding="utf-8")
    css = (ROOT / "site/foundation-v18.css").read_text(encoding="utf-8")
    for html in (explore, entity, compare):
        assert "foundation-v18.css" in html
        assert "aria-live=\"polite\"" in html
    assert "prefers-reduced-motion" in css
    assert "focus-visible" in css
