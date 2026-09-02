import json
from pathlib import Path


PATH = Path('data/candidates/biocultural-cognition-hypotheses-v1.json')


def load():
    return json.loads(PATH.read_text(encoding='utf-8'))


def test_family_is_candidate_only():
    data = load()
    assert data['status'] == 'CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED'
    rule = data['publication_rule'].lower()
    assert 'approved noema claim' in rule
    assert rule.startswith('no hypothesis')


def test_forbidden_retrodiagnosis_shortcuts_are_explicit():
    forbidden = ' | '.join(load()['forbidden_inferences']).lower()
    for phrase in ['witches were autistic', 'witches had adhd', 'shamans are neurodivergent', 'prophets had epilepsy']:
        assert phrase in forbidden


def test_every_hypothesis_has_rivals_and_discriminating_evidence():
    for hypothesis in load()['hypotheses']:
        assert len(hypothesis.get('rivals', [])) >= 3, hypothesis['id']
        assert len(hypothesis.get('discriminating_evidence', [])) >= 3, hypothesis['id']
        assert hypothesis['epistemic_status'] not in {'KNOWN', 'PROVEN', 'CAUSAL'}


def test_witchcraft_hypothesis_models_institutions_not_diagnosis():
    h = next(x for x in load()['hypotheses'] if x['id'] == 'BIOCULTURAL-H004')
    title = h['title'].lower()
    assert 'ideational' in title and 'institutional' in title
    assert 'neurological traits' in title
    assert any('print diffusion' in item.lower() for item in h['discriminating_evidence'])


def test_cultural_interpretation_is_separate_from_phenomenology():
    h = next(x for x in load()['hypotheses'] if x['id'] == 'BIOCULTURAL-H002')
    assert 'cultural scripts' in h['title'].lower()
    assert any('phenomenological' in item.lower() for item in h['discriminating_evidence'])
