from noema.ingest import SourceEnvelope, canonicalize_url
from noema.publish import is_publishable, public_projection


def test_doi_is_primary_dedupe_key():
    a = SourceEnvelope("A", "PAPER", "https://example.org/a", doi="10.1/ABC")
    b = SourceEnvelope("B", "PAPER", "https://other.example/b", doi="10.1/abc")
    assert a.dedupe_key == b.dedupe_key


def test_url_canonicalization_removes_tracking_query():
    assert canonicalize_url("HTTPS://Example.org/x/?utm_source=test") == "https://example.org/x"


def test_unreviewed_claim_is_not_publishable():
    assert not is_publishable({"access_level": "PUBLIC", "reviewed": False})


def test_restricted_knowledge_is_not_publishable():
    assert not is_publishable({"access_level": "COMMUNITY_RESTRICTED", "reviewed": True})
    assert not is_publishable({"access_level": "PUBLIC", "reviewed": True, "sacred_or_restricted": True})


def test_model_output_cannot_be_published_as_evidence():
    assert not is_publishable({"access_level": "PUBLIC", "reviewed": True, "model_generated_evidence": True})


def test_projection_removes_private_fields():
    result = public_projection([
        {
            "id": "1",
            "access_level": "PUBLIC",
            "reviewed": True,
            "private_notes": "not for site",
            "raw_source_text": "licensed text",
            "claim": "safe summary",
        }
    ])
    assert result == [{"id": "1", "access_level": "PUBLIC", "reviewed": True, "claim": "safe summary"}]
