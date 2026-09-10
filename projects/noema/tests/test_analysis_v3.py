from noema.analysis_v2 import BinaryObservation
from noema.analysis_v3 import (
    geographic_neighbor_agreement,
    haversine_km,
    model_survival_profile,
    phylogenetic_family_sensitivity,
    spatial_permutation_phi,
)


def rows():
    out=[]
    for i in range(24):
        fam='F1' if i < 12 else 'F2'
        region='R1' if i % 2 == 0 else 'R2'
        a=i % 3 != 0
        b=a if i % 5 else not a
        lat=10 + (i % 6) * 0.4 + (20 if fam == 'F2' else 0)
        lon=20 + (i % 6) * 0.4 + (20 if fam == 'F2' else 0)
        out.append(BinaryObservation(
            subject_id=f's{i}', feature_a=a, feature_b=b,
            strata={'language_family':fam,'region':region},
            source_family='S1' if i % 4 else 'S2',
            time=float(i), latitude=lat, longitude=lon,
        ))
    return out


def test_haversine_identity_and_scale():
    assert haversine_km(0,0,0,0) == 0
    assert 110 < haversine_km(0,0,1,0) < 112


def test_spatial_neighbor_diagnostic_is_noncausal():
    result=geographic_neighbor_agreement(rows(), radius_km=250)
    assert result['status']=='DESCRIPTIVE_SPATIAL_CLUSTERING_DIAGNOSTIC'
    assert result['neighbor_pairs'] > 0
    assert result['automatic_causal_promotion'] is False
    assert 'not evidence of diffusion or causation' in result['interpretation']


def test_spatial_permutation_is_deterministic_and_noncausal():
    a=spatial_permutation_phi(rows(), permutations=99, seed=7)
    b=spatial_permutation_phi(rows(), permutations=99, seed=7)
    assert a==b
    assert 0 < a['two_sided_permutation_p'] <= 1
    assert a['automatic_causal_promotion'] is False


def test_phylogenetic_family_sensitivity_is_not_phylogenetic_claim():
    result=phylogenetic_family_sensitivity(rows())
    assert result['status']=='LANGUAGE_FAMILY_SENSITIVITY_ONLY'
    assert result['families']==2
    assert result['automatic_causal_promotion'] is False
    assert 'not a phylogenetic comparative model' in result['warning']


def test_model_survival_does_not_create_magic_score_or_causality():
    result=model_survival_profile(rows())
    assert result['analysis_id']=='NOEMA-MODEL-SURVIVAL-V1'
    assert result['candidate_only'] is True
    assert result['automatic_causal_promotion'] is False
    assert 'score' not in result
    assert 'explicit_phylogenetic_comparative_model' in result['required_next_models']


def test_spatial_abstains_without_coordinates():
    minimal=[BinaryObservation(str(i), True, False) for i in range(5)]
    result=geographic_neighbor_agreement(minimal)
    assert result['status']=='INSUFFICIENT_GEOCODED_OBSERVATIONS'
    assert result['automatic_causal_promotion'] is False
