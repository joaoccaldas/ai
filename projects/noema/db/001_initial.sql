CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url text,
  title text NOT NULL,
  source_type text NOT NULL,
  publisher text,
  published_at timestamptz,
  doi text,
  citation_key text,
  license text,
  access_level text NOT NULL DEFAULT 'PUBLIC',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  canonical_name text NOT NULL,
  description text,
  start_year_min integer,
  start_year_max integer,
  end_year_min integer,
  end_year_max integer,
  geom geometry(Geometry,4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_text text NOT NULL,
  claim_type text NOT NULL,
  epistemic_status text NOT NULL DEFAULT 'SUPPORTED',
  evidence_level text NOT NULL DEFAULT 'E1',
  confidence numeric(5,4) NOT NULL DEFAULT 0.5,
  source_id uuid REFERENCES sources(id),
  subject_entity_id uuid REFERENCES entities(id),
  predicate text,
  object_entity_id uuid REFERENCES entities(id),
  object_literal jsonb,
  valid_time_start_min integer,
  valid_time_start_max integer,
  valid_time_end_min integer,
  valid_time_end_max integer,
  location geometry(Geometry,4326),
  extraction_method text,
  reviewed boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid NOT NULL REFERENCES entities(id),
  to_entity_id uuid NOT NULL REFERENCES entities(id),
  relation_type text NOT NULL,
  confidence numeric(5,4) NOT NULL DEFAULT 0.5,
  status text NOT NULL DEFAULT 'CANDIDATE',
  supporting_claim_ids uuid[] NOT NULL DEFAULT '{}',
  confounders jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  statement text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  prior_probability numeric(5,4) NOT NULL DEFAULT 0.5,
  posterior_probability numeric(5,4) NOT NULL DEFAULT 0.5,
  falsification_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternative_hypotheses jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_by text,
  human_review_status text NOT NULL DEFAULT 'UNREVIEWED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hypothesis_evidence (
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  direction text NOT NULL,
  weight numeric(6,4) NOT NULL DEFAULT 1.0,
  independence_score numeric(5,4) NOT NULL DEFAULT 0.5,
  notes text,
  PRIMARY KEY (hypothesis_id, claim_id)
);

CREATE TABLE IF NOT EXISTS hypothesis_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  version integer NOT NULL,
  posterior_probability numeric(5,4) NOT NULL,
  change_summary text NOT NULL,
  evidence_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hypothesis_id, version)
);

CREATE TABLE IF NOT EXISTS embeddings (
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  model text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (object_type, object_id, model)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  actor text NOT NULL,
  object_type text,
  object_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_geom ON entities USING gist(geom);
CREATE INDEX IF NOT EXISTS idx_claims_source ON claims(source_id);
CREATE INDEX IF NOT EXISTS idx_claims_subject ON claims(subject_entity_id);
CREATE INDEX IF NOT EXISTS idx_claims_location ON claims USING gist(location);
CREATE INDEX IF NOT EXISTS idx_relationships_from_to ON relationships(from_entity_id,to_entity_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
