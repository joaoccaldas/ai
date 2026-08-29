-- Claim extraction staging. Proposed claims are not evidence.

CREATE TABLE IF NOT EXISTS claim_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_fingerprint text NOT NULL UNIQUE,
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  subject_entity_id uuid REFERENCES entities(id),
  object_entity_id uuid REFERENCES entities(id),
  claim_text text NOT NULL,
  claim_type text NOT NULL,
  predicate text,
  object_literal jsonb,
  valid_time_start_min integer,
  valid_time_start_max integer,
  valid_time_end_min integer,
  valid_time_end_max integer,
  location geometry(Geometry,4326),
  extraction_method text NOT NULL,
  extractor_version text,
  extraction_confidence numeric(5,4) NOT NULL DEFAULT 0.5,
  evidence_level_proposed text NOT NULL DEFAULT 'E0',
  epistemic_status_proposed text NOT NULL DEFAULT 'SPECULATIVE',
  status text NOT NULL DEFAULT 'PENDING_REVIEW',
  source_locator jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  approved_claim_id uuid REFERENCES claims(id),
  CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  CHECK (jsonb_typeof(source_locator) = 'object' AND source_locator <> '{}'::jsonb)
);

CREATE INDEX IF NOT EXISTS idx_claim_candidates_review
  ON claim_candidates(status, extraction_confidence DESC, first_seen_at ASC);
CREATE INDEX IF NOT EXISTS idx_claim_candidates_source
  ON claim_candidates(source_id, status);
CREATE INDEX IF NOT EXISTS idx_claim_candidates_subject
  ON claim_candidates(subject_entity_id, status)
  WHERE subject_entity_id IS NOT NULL;
