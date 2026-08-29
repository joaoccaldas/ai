from noema.media import commons_candidate, html_text, media_candidate_fingerprint


def test_html_text_removes_markup_and_decodes_entities():
    assert html_text('<b>Athena</b> &amp; owl') == 'Athena & owl'


def test_media_fingerprint_is_stable_and_entity_scoped():
    a = media_candidate_fingerprint('GOD-A', 'COMMONS', 1, 'https://example/x.jpg')
    b = media_candidate_fingerprint('GOD-A', 'COMMONS', 1, 'https://example/x.jpg')
    c = media_candidate_fingerprint('GOD-B', 'COMMONS', 1, 'https://example/x.jpg')
    assert a == b and a != c


def test_commons_candidate_remains_pending_even_with_license_metadata():
    entity = {'id':'GOD-ATHENA','name':'Athena','kind':'DEITY'}
    page = {'pageid':1,'title':'File:Athena.jpg','imageinfo':[{'url':'https://upload.wikimedia.org/x.jpg','descriptionurl':'https://commons.wikimedia.org/wiki/File:Athena.jpg','extmetadata':{'Artist':{'value':'<b>Example</b>'},'LicenseShortName':{'value':'CC BY-SA 4.0'}}}]}
    out = commons_candidate(entity,page,'Athena deity')
    assert out['creator'] == 'Example'
    assert out['license'] == 'CC BY-SA 4.0'
    assert out['identity_match_status'] == 'PENDING_REVIEW'
    assert out['rights_review_status'] == 'PENDING_REVIEW'
    assert out['decision'] == 'PENDING_REVIEW'
