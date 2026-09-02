from noema.pleiades import normalize_place


def athens_fixture():
    return {
        "id": "579885",
        "title": "Athenae",
        "description": "A major Greek city-state and the principal city of Attika.",
        "reprPoint": [23.723914356100423, 37.97163725472171],
        "bbox": [23.6172739, 37.937222, 23.7441, 37.9943588],
        "placeTypes": ["settlement"],
        "review_state": "published",
        "provenance": "Barrington Atlas: BAtlas 59 B3 Athenae",
        "connectsWith": ["https://pleiades.stoa.org/places/579888"],
        "names": [
            {
                "attested": "Ἀθῆναι",
                "romanized": ["Athēnai"],
                "language": "grc",
                "start": -750,
                "end": 640,
                "associationCertainty": "certain",
            }
        ],
    }


def test_normalize_place_preserves_source_coordinates_and_names():
    place = normalize_place(athens_fixture())
    assert place.place_id == "579885"
    assert place.longitude == 23.723914356100423
    assert place.latitude == 37.97163725472171
    assert place.names[0].attested == "Ἀθῆναι"
    assert place.names[0].language == "grc"
    link = place.as_link_record()
    assert link["evidence_status"] == "PLACE_IDENTITY_CONTEXT_NOT_RELIGIOUS_EVIDENCE"


def test_missing_coordinates_remain_missing():
    raw = athens_fixture()
    raw.pop("reprPoint")
    place = normalize_place(raw)
    assert place.longitude is None and place.latitude is None


def test_invalid_coordinates_fail_loudly():
    raw = athens_fixture()
    raw["reprPoint"] = [999, 95]
    try:
        normalize_place(raw)
    except ValueError as exc:
        assert "coordinate" in str(exc).lower()
    else:
        raise AssertionError("invalid source coordinates must not be plotted")


def test_missing_title_fails_loudly():
    raw = athens_fixture()
    raw["title"] = ""
    try:
        normalize_place(raw)
    except ValueError as exc:
        assert "title" in str(exc).lower()
    else:
        raise AssertionError("place without identity title must not normalize")
