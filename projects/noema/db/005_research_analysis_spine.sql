-- NOEMA v1 research analysis spine.
-- Adds versioned dataset, feature, analysis, relationship-candidate, source-dependence,
-- hypothesis-test, and media provenance objects without changing existing evidence semantics.

CREATE TABLE IF NOT EXISTS dataset_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  dataset_id text NOT NULL,
  source_version text,
  source_digest text NOT NULL,
  canonical_url text,
  license text,
  access_level text NOT NULL DEFAULT 'PUBLIC',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'VERIFIED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(provider, dataset_id, source_digest),
  CHECK (access_level IN ('PUBLIC','ACADEMIC_USE','ATTRIBUTION_REQUIRED','COMMUNITY_RESTRICTED','DO_NOT_PUBLISH')),
  CHECK (status IN ('DISCOVERED','VERIFIED','SUPERSEDED','REJECTED'))
);

CREATE TABLE IF NOT EXISTS feature_assertions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assertion_fingerprint text NOT NULL UNIQUE,
  dataset_snapshot_id uuid NOT NULL REFERENCES dataset_snapshots(id) ON DELETE RESTRICT,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  subject_entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  subject_external_id text NOT NULL,
  dimension text NOT NULL,
  facet text NOT NULL,
  state text NOT NULL,
  strength text,
  temporal_scope text,
  valid_time_start_min integer,
  valid_time_start_max integer,
  valid_time_end_min integer,
  valid_time_end_max integer,
  variation jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_locator jsonb NOT NULL,
  upstream_variable text,
  upstream_code text,
  mapping_status text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state IN ('PRESENT','ABSENT','UNKNOWN','CONTESTED','NOT_APPLICABLE')),
  CHECK (strength IS NULL OR strength IN ('DIRECT_ATTESTATION','STRONG_INFERENCE','MODERATE_INFERENCE','WEAK_INFERENCE','MODEL_RECONSTRUCTION')),
  CHECK (temporal_scope IS NULL OR temporal_scope IN ('CONTEMPORARY','HISTORICAL_ATTESTED','ARCHAEOLOGICAL','RECONSTRUCTED_ANCESTRAL','UNSPECIFIED')),
  CHECK (jsonb_typeof(source_locator) = 'object' AND source_locator <> '{}'::jsonb)
);

CREATE TABLE IF NOT EXISTS source_dependencies (
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  depends_on_source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  dependency_type text NOT NULL,
  confidence numeric(5,4) NOT NULL DEFAULT 0.5,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, depends_on_source_id, dependency_type),
  CHECK (source_id <> depends_on_source_id),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (dependency_type IN ('CITES','REUSES_DATASET','DERIVES_FROM','TRANSLATION_OF','EDITION_OF','SAME_RESEARCH_PROGRAM','POSSIBLE_DEPENDENCE','UNKNOWN'))
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type text NOT NULL,
  cohort_id text NOT NULL,
  cohort_definition jsonb NOT NULL,
  dataset_snapshot_ids uuid[] NOT NULL DEFAULT '{}',
  code_commit text,
  code_version text,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  random_seed bigint,
  status text NOT NULL DEFAULT 'RUNNING',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  diagnostics jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (status IN ('RUNNING','SUCCEEDED','FAILED','INVALIDATED'))
);

CREATE TABLE IF NOT EXISTS relationship_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_fingerprint text NOT NULL UNIQUE,
  from_entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  from_feature text,
  to_feature text,
  relation_type text NOT NULL,
  candidate_score numeric(12,6),
  status text NOT NULL DEFAULT 'DESCRIPTIVE_CANDIDATE',
  cohort_id text NOT NULL,
  analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  diagnostics jsonb NOT NULL DEFAULT '{}'::jsonb,
  unresolved_confounders jsonb NOT NULL DEFAULT '[]'::jsonb,
  supporting_claim_ids uuid[] NOT NULL DEFAULT '{}',
  source_snapshot_ids uuid[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  CHECK (status IN ('DESCRIPTIVE_CANDIDATE','NEEDS_STRONGER_MODEL','SUPPORTED','DISPUTED','REJECTED')),
  CHECK (candidate_score IS NULL OR candidate_score >= 0)
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  result_type text NOT NULL,
  rank integer,
  subject_key text,
  object_key text,
  metrics jsonb NOT NULL,
  interpretation_status text NOT NULL DEFAULT 'DESCRIPTIVE_ONLY',
  unresolved_confounders jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (interpretation_status IN ('DESCRIPTIVE_ONLY','HYPOTHESIS_GENERATION','MODEL_SUPPORTED','DISPUTED','INVALIDATED'))
);

CREATE TABLE IF NOT EXISTS hypothesis_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  test_type text NOT NULL,
  model text NOT NULL,
  preregistered_expectation text,
  result jsonb NOT NULL,
  diagnostics jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensitivity jsonb NOT NULL DEFAULT '{}'::jsonb,
  dataset_snapshot_hash text,
  code_commit text,
  status text NOT NULL DEFAULT 'COMPLETED',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  CHECK (status IN ('PLANNED','RUNNING','COMPLETED','FAILED','INVALIDATED'))
);

CREATE TABLE IF NOT EXISTS entity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'IMAGE',
  source_page_url text NOT NULL,
  media_url text NOT NULL,
  creator text,
  license text,
  rights_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  attribution_text text,
  caption text,
  alt_text text,
  date_label text,
  is_primary boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  UNIQUE(entity_id, media_url),
  CHECK (media_type IN ('IMAGE','MAP','MANUSCRIPT','ARTIFACT_PHOTO','SITE_PHOTO','DIAGRAM')),
  CHECK (rights_status IN ('PENDING_REVIEW','APPROVED','RESTRICTED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_dataset_snapshots_provider ON dataset_snapshots(provider, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_assertions_subject ON feature_assertions(subject_entity_id, dimension, facet);
CREATE INDEX IF NOT EXISTS idx_feature_assertions_external ON feature_assertions(subject_external_id, dimension, facet);
CREATE INDEX IF NOT EXISTS idx_feature_assertions_review ON feature_assertions(review_status, mapping_status, dimension);
CREATE INDEX IF NOT EXISTS idx_relationship_candidates_status ON relationship_candidates(status, cohort_id, candidate_score DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_type ON analysis_runs(analysis_type, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_run_rank ON analysis_results(analysis_run_id, rank);
CREATE INDEX IF NOT EXISTS idx_hypothesis_tests_hypothesis ON hypothesis_tests(hypothesis_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_media_entity ON entity_media(entity_id, rights_status, is_primary DESC);
