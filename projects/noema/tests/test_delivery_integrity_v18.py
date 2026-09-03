from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/build_search_index_v18.py"
spec = importlib.util.spec_from_file_location("build_search_index_v18", SCRIPT)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(mod)


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
    built = mod.build([source])
    assert built["projection"] == "NOEMA_COMPACT_SEARCH_V18"
    assert built["counts"]["records"] == 1
    record = built["records"][0]
    assert record["id"] == "GOD-TEST"
    assert "OFFERING" in record["components"]
    assert "sources" not in record
    assert "claim" not in record
    assert "evidence" not in record


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


def test_accessibility_foundation_is_wired() -> None:
    html = (ROOT / "site/explore.html").read_text(encoding="utf-8")
    css = (ROOT / "site/foundation-v18.css").read_text(encoding="utf-8")
    assert "foundation-v18.css" in html
    assert "aria-live=\"polite\"" in html
    assert "prefers-reduced-motion" in css
    assert "focus-visible" in css
