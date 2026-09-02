from noema.openalex import citation_links, normalize_work


def sample_work():
    return {
        "id": "https://openalex.org/W123",
        "title": "Ritual and Cognition",
        "doi": "https://doi.org/10.1234/ABC",
        "publication_date": "2026-01-15",
        "type": "article",
        "primary_location": {"source": {"display_name": "Example Journal"}},
        "authorships": [
            {"author": {"display_name": "A. Scholar"}},
            {"author": {"display_name": "B. Researcher"}},
        ],
        "topics": [{"display_name": "Religion"}, {"display_name": "Cognition"}],
        "referenced_works": ["https://openalex.org/W9"],
        "related_works": ["W8"],
    }


def test_normalize_openalex_work():
    work = normalize_work(sample_work())
    assert work.work_id == "W123"
    assert work.doi == "10.1234/abc"
    assert work.source_name == "Example Journal"
    assert work.authors == ("A. Scholar", "B. Researcher")
    candidate = work.as_candidate()
    assert candidate["candidate_only"] is True
    assert candidate["status"] == "CANDIDATE_UNREVIEWED"
    assert "not evidence" in candidate["claim_policy"]


def test_citation_links_never_block_independence():
    links = citation_links(normalize_work(sample_work()))
    assert {link["link_type"] for link in links} == {"CITES", "RELATED_WORK_HINT"}
    assert all(link["independence_blocking"] is False for link in links)


def test_missing_work_id_fails_loudly():
    raw = sample_work()
    raw["id"] = None
    try:
        normalize_work(raw)
    except ValueError as exc:
        assert "id" in str(exc).lower()
    else:
        raise AssertionError("missing OpenAlex id must fail")
