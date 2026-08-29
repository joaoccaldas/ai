-- NOEMA ingestion provenance and human-review queue.
-- This migration is additive and idempotent.

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  source_kind text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'RUNNING',
  source_version text,
  source_digest text,
  discovered_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS entity_sources (
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id text,
  source_role text NOT NULL DEFAULT 'DESCRIBES',
  observation_year integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, source_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_sources_external
  ON entity_sources(source_id, external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  object_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  priority integer NOT NULL DEFAULT 50,
  reason text NOT NULL,
  proposed_action text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  UNIQUE(item_type, object_id, status)
);

CREATE INDEX IF NOT EXISTS idx_review_queue_pending
  ON review_queue(status, priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_provider
  ON ingestion_runs(provider, started_at DESC);
