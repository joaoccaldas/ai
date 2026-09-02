from noema.source_dependence import SourceFingerprint, build_dependency_graph, compare_sources


def test_same_work_collapses_multiple_identifiers():
    a = SourceFingerprint(source_id="A", doi="https://doi.org/10.1234/ABC", pmid="123")
    b = SourceFingerprint(source_id="B", doi="10.1234/abc", pmid="999")
    edges = compare_sources(a, b)
    assert len(edges) == 1
    assert edges[0].dependency_type == "SAME_WORK"
    assert edges[0].independence_blocking is True


def test_shared_dataset_and_sample_are_explicit_dependencies():
    a = SourceFingerprint(source_id="A", datasets=("Seshat Polaris 2026",), samples=("cohort-7",))
    b = SourceFingerprint(source_id="B", datasets=(" seshat   polaris 2026 ",), samples=("COHORT-7",))
    edge_types = {edge.dependency_type for edge in compare_sources(a, b)}
    assert edge_types == {"SHARED_DATASET", "SHARED_SAMPLE"}


def test_author_overlap_is_not_encoded_as_dependence():
    a = SourceFingerprint(source_id="A")
    b = SourceFingerprint(source_id="B")
    assert compare_sources(a, b) == []


def test_explicit_parent_relation_blocks_independence():
    a = SourceFingerprint(source_id="A", parent_source_ids=("B",))
    b = SourceFingerprint(source_id="B")
    edges = compare_sources(a, b)
    assert len(edges) == 1
    assert edges[0].dependency_type == "DERIVED_FROM"
    assert edges[0].independence_blocking is True


def test_graph_builds_connected_independence_groups():
    graph = build_dependency_graph(
        [
            SourceFingerprint(source_id="A", datasets=("shared-data",)),
            SourceFingerprint(source_id="B", datasets=("shared-data",), samples=("sample-x",)),
            SourceFingerprint(source_id="C", samples=("sample-x",)),
            SourceFingerprint(source_id="D"),
        ]
    )
    assert ["A", "B", "C"] in graph["independence_groups"]
    assert ["D"] in graph["independence_groups"]
    assert graph["counts"]["sources"] == 4
    assert graph["counts"]["dependency_edges"] == 2


def test_duplicate_source_ids_fail_loudly():
    try:
        build_dependency_graph([SourceFingerprint(source_id="A"), SourceFingerprint(source_id="A")])
    except ValueError as exc:
        assert "unique" in str(exc)
    else:
        raise AssertionError("duplicate source IDs must not silently merge")
