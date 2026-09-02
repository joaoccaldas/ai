import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "discover_openalex.py"

spec = importlib.util.spec_from_file_location("discover_openalex", SCRIPT)
mod = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)


def test_normalize_work_is_candidate_only_and_dependence_hint_only():
    work = {
        "id": "https://openalex.org/W123",
        "display_name": "Religion and altered states",
        "doi": "https://doi.org/10.1234/ABC.DEF",
        "publication_date": "2026-08-01",
        "publication_year": 2026,
        "type": "article",
        "cited_by_count": 12,
        "referenced_works": ["https://openalex.org/W1"],
        "related_works": ["https://openalex.org/W2"],
        "primary_location": {"source": {"display_name": "Journal", "issn_l": "1234-5678"}},
        "ids": {"doi": "https://doi.org/10.1234/ABC.DEF", "pmid": "https://pubmed.ncbi.nlm.nih.gov/123/"},
        "topics": [{"id": "T1", "display_name": "Religion", "score": 0.9}],
        "concepts": [{"id": "C1", "display_name": "Psychology", "score": 0.7}],
    }
    record = mod.normalize_work(work, provider_query="religion")
    assert record["status"] == "CANDIDATE_UNREVIEWED"
    assert record["candidate_only"] is True
    assert record["dependence_hint_only"] is True
    assert record["doi"] == "10.1234/abc.def"
    assert "does not establish evidentiary independence" in record["epistemic_note"]


def test_openalex_missing_id_is_rejected():
    try:
        mod.normalize_work({"display_name": "No id"})
    except ValueError as exc:
        assert "missing id" in str(exc).lower()
    else:
        raise AssertionError("missing OpenAlex id must fail")


def test_query_pack_includes_biobehavioral_and_historical_domains():
    text = " ".join(mod.QUERIES).lower()
    assert "autism" in text
    assert "witchcraft" in text
    assert "psychedelic" in text
    assert "possession" in text
