from noema.scientific_reasoning import (
    AlternativeMechanism,
    CausalAlternativesAssessment,
    CorrelationAssessment,
    DatingDistribution,
    DetectabilityModel,
    EvidenceCourtCase,
    InferenceStrength,
    MechanismCandidate,
    effective_independent_evidence,
)


def test_probabilistic_chronology_respects_uncertainty():
    older = DatingDistribution(42000, 500, "AMS", True, "src-a")
    younger = DatingDistribution(40000, 500, "AMS", True, "src-b")
    p = older.probability_older_than(younger)
    assert 0.97 < p < 1.0


def test_low_detectability_makes_absence_uninformative():
    model = DetectabilityModel(0.2, 0.5, 0.5, 0.8)
    assert model.observation_probability_if_present == 0.04
    assert model.absence_is_informative is False


def test_high_detectability_can_make_absence_informative():
    model = DetectabilityModel(0.95, 0.95, 0.95, 0.95)
    assert model.observation_probability_if_present > 0.8
    assert model.absence_is_informative is True


def test_correlation_never_auto_becomes_causal_supported():
    weak = CorrelationAssessment("ritual", "cohesion", 0.5, 500, 2)
    assert weak.inference_strength == InferenceStrength.ASSOCIATIONAL

    strong_observational = CorrelationAssessment(
        "ritual",
        "cohesion",
        0.5,
        5000,
        8,
        temporal_order_established=True,
        confounders_addressed=("ecology", "shared ancestry", "source dependence"),
        source_independence=0.9,
        replication_count=4,
    )
    assert strong_observational.inference_strength == InferenceStrength.CAUSAL_CANDIDATE
    assert strong_observational.inference_strength != InferenceStrength.CAUSAL_SUPPORTED
    assert "correlation implies causation" in strong_observational.prohibited_inferences


def test_causal_alternatives_require_competition_and_can_remain_ambiguous():
    assessment = CausalAlternativesAssessment(
        "similar mortuary form appears in two populations",
        (
            MechanismCandidate(AlternativeMechanism.DIFFUSION, 0.7, 0.4, 0.9, 0.8, ("contact evidence weak",)),
            MechanismCandidate(AlternativeMechanism.CONVERGENCE, 0.7, 0.7, 0.9, 0.8),
            MechanismCandidate(AlternativeMechanism.SHARED_ANCESTRY, 0.4, 0.4, 0.8, 0.8),
        ),
    )
    ranked = assessment.ranked()
    assert ranked[0].mechanism == AlternativeMechanism.CONVERGENCE
    assert assessment.winner_is_decisive is False


def test_evidence_court_requires_alternatives_falsification_and_human_review():
    case = EvidenceCourtCase(
        case_id="CASE-001",
        claim="A psychoactive plant was used ritually",
        direct_observations=("plant residue detected", "directly dated human context"),
        supporting_sources=("doi:10.example/1",),
        alternative_explanations=("habitual consumption", "medicinal use"),
        prohibited_inferences=("psychoactive exposure implies ritual",),
        falsification_criteria=("secure non-ritual consumption context with same residue pattern",),
        culturally_sensitive=True,
    )
    assert case.human_review_required is True
    assert case.public_release_blocked is False


def test_restricted_material_blocks_public_release():
    case = EvidenceCourtCase(
        case_id="CASE-002",
        claim="Restricted ceremonial knowledge has a particular meaning",
        direct_observations=("community restriction recorded",),
        supporting_sources=("community-source-1",),
        alternative_explanations=("meaning is not authorized for public interpretation",),
        falsification_criteria=("authorized community review changes release status",),
        culturally_sensitive=True,
        restricted_material=True,
    )
    assert case.public_release_blocked is True


def test_effective_independent_evidence_is_bounded_and_discounted():
    assert effective_independent_evidence([]) == 0.0
    assert effective_independent_evidence([1.0]) == 1.0
    assert effective_independent_evidence([0.5, 0.5]) == 0.75
