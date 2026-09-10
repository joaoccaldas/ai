from noema.ingestion_orchestrator import SourceState, build_ingestion_plan, durable_candidate_key, ledger_record


def test_priority_prefers_information_rich_gap_filling_source():
    sources = [
        SourceState('A', .9, .9, .9, .5, .8, .5),
        SourceState('B', .2, .2, .1, 1.0, .2, 1.0),
    ]
    plan = build_ingestion_plan(sources)
    assert plan['ranked_sources'][0]['source_id'] == 'A'
    assert plan['automatic_promotion'] is False
    assert all(x['candidate_only'] is True for x in plan['ranked_sources'])


def test_candidate_identity_rejects_title_only_dedup():
    assert durable_candidate_key(doi='10.1000/ABC') == 'doi:10.1000/abc'
    try:
        durable_candidate_key()
    except ValueError as exc:
        assert 'title-only deduplication is forbidden' in str(exc)
    else:
        raise AssertionError('missing identity should fail')


def test_ledger_is_candidate_only():
    rec = ledger_record(source_id='CROSSREF', candidate_key='doi:10.1/x', snapshot_id='2026-09-10T00:00:00Z', payload_digest='sha256:abc')
    assert rec['status'] == 'CANDIDATE_UNREVIEWED'
    assert rec['human_review_required'] is True
    assert rec['automatic_promotion'] is False
