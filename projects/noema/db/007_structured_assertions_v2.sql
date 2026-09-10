-- NOEMA V2 typed assertion, source-integrity and epistemic-stage persistence.
-- Additive/idempotent: legacy feature_assertions remains intact for deterministic
-- federation projections while richer source extractions enter this candidate-only spine.

CREATE TABLE IF NOT EXISTS structured_assertion_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assertion_key text NOT NULL UNIQUE,
  source_ref text NOT NULL,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  assertion_kind text NOT NULL,
  assertion_text text NOT NULL,
  source_locator jsonb NOT NULL,
  observation_state text,
  subject_ref text,
  object_ref text,
  subject_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  object_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  alternatives text[] NOT NULL DEFAULT '{}',
  limitations text[] NOT NULL DEFAULT '{}',
  sensitive boolean NOT NULL DEFAULT false,
  restricted boolean NOT NULL DEFAULT false,
  candidate_only boolean NOT NULL DEFAULT true,
  automatic_promotion boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (assertion_kind IN (
    'OBSERVATION','MEASUREMENT','CHRONOLOGY','ENTITY',
    'RELATIONSHIP_CLAIM','INTERPRETATION','LIMITATION'
  )),
  CHECK (observation_state IS NULL OR observation_state IN (
    'PRESENT','ABSENT_AFTER_SEARCH','UNKNOWN','NOT_RECORDED',
    'NOT_APPLICABLE','CONTESTED','PRESERVATION_UNLIKELY','SOURCE_UNAVAILABLE'
  )),
  CHECK (jsonb_typeof(source_locator) = 'object' AND source_locator <> '{}'::jsonb),
  CHECK (assertion_kind <> 'INTERPRETATION' OR cardinality(alternatives) > 0),
  CHECK (NOT restricted OR sensitive),
  CHECK (candidate_only = true),
  CHECK (automatic_promotion = false),
  CHECK (review_status IN ('PENDING_REVIEW','APPROVED','REJECTED','DISPUTED','NEEDS_EVIDENCE'))
);

CREATE INDEX IF NOT EXISTS idx_structured_assertions_review
  ON structured_assertion_candidates(review_status, assertion_kind, first_seen_at);
CREATE INDEX IF NOT EXISTS idx_structured_assertions_source_ref
  ON structured_assertion_candidates(source_ref, review_status);
CREATE INDEX IF NOT EXISTS idx_structured_assertions_source_id
  ON structured_assertion_candidates(source_id, review_status)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_structured_assertions_subject_ref
  ON structured_assertion_candidates(subject_ref)
  WHERE subject_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS assertion_field_confidence (
  assertion_id uuid NOT NULL REFERENCES structured_assertion_candidates(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  extraction_confidence numeric(5,4) NOT NULL,
  evidential_confidence numeric(5,4),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assertion_id, field_name),
  CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  CHECK (evidential_confidence IS NULL OR (evidential_confidence >= 0 AND evidential_confidence <= 1))
);

CREATE TABLE IF NOT EXISTS source_integrity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ref text NOT NULL,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_date_text text,
  related_source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  related_source_ref text,
  note text,
  integrity_effect text NOT NULL DEFAULT 'REASSESS_DEPENDENCIES',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (integrity_effect IN ('REASSESS_DEPENDENCIES','METADATA_ONLY','NO_ACTION'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_integrity_event_identity
  ON source_integrity_events(
    source_ref,
    event_type,
    COALESCE(event_date_text, ''),
    COALESCE(related_source_ref, '')
  );
CREATE INDEX IF NOT EXISTS idx_source_integrity_events_source_ref
  ON source_integrity_events(source_ref, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_integrity_events_source_id
  ON source_integrity_events(source_id, first_seen_at DESC)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_integrity_events_type
  ON source_integrity_events(event_type, first_seen_at DESC);

CREATE TABLE IF NOT EXISTS assertion_extractor_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assertion_key text NOT NULL,
  extractor_id text NOT NULL,
  extractor_version text NOT NULL DEFAULT 'UNKNOWN',
  signature_hash text NOT NULL,
  assertion_payload jsonb NOT NULL,
  source_grounding_checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(assertion_payload) = 'object'),
  UNIQUE(assertion_key, extractor_id, extractor_version)
);

CREATE INDEX IF NOT EXISTS idx_assertion_extractor_votes_key
  ON assertion_extractor_votes(assertion_key, created_at DESC);

CREATE TABLE IF NOT EXISTS assertion_reconciliations (
  assertion_key text PRIMARY KEY,
  extractor_count integer NOT NULL,
  extractor_votes integer NOT NULL,
  variant_count integer NOT NULL,
  reconciliation_status text NOT NULL,
  source_grounding_verified boolean NOT NULL DEFAULT false,
  human_review_required boolean NOT NULL DEFAULT true,
  automatic_promotion boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  CHECK (extractor_count >= 1),
  CHECK (extractor_votes >= 0 AND extractor_votes <= extractor_count),
  CHECK (variant_count >= 1),
  CHECK (reconciliation_status IN ('AGREEMENT','DISAGREEMENT','INCOMPLETE')),
  CHECK (human_review_required = true),
  CHECK (automatic_promotion = false)
);

-- Record how far an analysis legitimately progressed. These fields report
-- epistemic workflow stage; they are not confidence/truth scores.
ALTER TABLE analysis_runs
  ADD COLUMN IF NOT EXISTS max_epistemic_stage text;
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS epistemic_stage text;
ALTER TABLE relationship_candidates
  ADD COLUMN IF NOT EXISTS epistemic_stage text NOT NULL DEFAULT 'NOMINATION';
ALTER TABLE hypothesis_tests
  ADD COLUMN IF NOT EXISTS epistemic_stage text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analysis_runs_epistemic_stage_check') THEN
    ALTER TABLE analysis_runs ADD CONSTRAINT analysis_runs_epistemic_stage_check
      CHECK (max_epistemic_stage IS NULL OR max_epistemic_stage IN (
        'OBSERVED','REVIEWED','NOMINATION','STRATIFIED','ADJUSTED',
        'SPATIAL','PHYLOGENETIC','TEMPORAL','CAUSAL_CANDIDATE'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analysis_results_epistemic_stage_check') THEN
    ALTER TABLE analysis_results ADD CONSTRAINT analysis_results_epistemic_stage_check
      CHECK (epistemic_stage IS NULL OR epistemic_stage IN (
        'OBSERVED','REVIEWED','NOMINATION','STRATIFIED','ADJUSTED',
        'SPATIAL','PHYLOGENETIC','TEMPORAL','CAUSAL_CANDIDATE'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_candidates_epistemic_stage_check') THEN
    ALTER TABLE relationship_candidates ADD CONSTRAINT relationship_candidates_epistemic_stage_check
      CHECK (epistemic_stage IN (
        'OBSERVED','REVIEWED','NOMINATION','STRATIFIED','ADJUSTED',
        'SPATIAL','PHYLOGENETIC','TEMPORAL','CAUSAL_CANDIDATE'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hypothesis_tests_epistemic_stage_check') THEN
    ALTER TABLE hypothesis_tests ADD CONSTRAINT hypothesis_tests_epistemic_stage_check
      CHECK (epistemic_stage IS NULL OR epistemic_stage IN (
        'OBSERVED','REVIEWED','NOMINATION','STRATIFIED','ADJUSTED',
        'SPATIAL','PHYLOGENETIC','TEMPORAL','CAUSAL_CANDIDATE'
      ));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id text PRIMARY KEY,
  description text NOT NULL,
  repository_path text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO schema_migrations (migration_id, description, repository_path)
VALUES
  ('001', 'initial provenance-first graph', 'projects/noema/db/001_initial.sql'),
  ('002', 'ingestion provenance and review queue', 'projects/noema/db/002_ingestion_provenance.sql'),
  ('003', 'source candidate staging', 'projects/noema/db/003_source_candidate_staging.sql'),
  ('004', 'claim candidate staging', 'projects/noema/db/004_claim_candidate_staging.sql'),
  ('005', 'research analysis spine', 'projects/noema/db/005_research_analysis_spine.sql'),
  ('006', 'identity and media resolution', 'projects/noema/db/006_identity_media_resolution.sql'),
  ('007', 'structured assertions v2 and epistemic stages', 'projects/noema/db/007_structured_assertions_v2.sql')
ON CONFLICT (migration_id) DO NOTHING;
