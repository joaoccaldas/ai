-- Discovery staging is intentionally separate from the approved sources table.

CREATE TABLE IF NOT EXISTS source_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_key text NOT NULL,
  title text NOT NULL,
  canonical_url text NOT NULL,
  doi text,
  publisher_or_container text,
  work_type text,
  discovery_reason text NOT NULL,
  relevance_score numeric(8,3) NOT NULL DEFAULT 0,
  published_date date,
  indexed_date date,
  status text NOT NULL DEFAULT 'PENDING_REVIEW',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  approved_source_id uuid REFERENCES sources(id),
  UNIQUE(provider, external_key)
);

CREATE INDEX IF NOT EXISTS idx_source_candidates_review
  ON source_candidates(status, relevance_score DESC, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_candidates_doi
  ON source_candidates(lower(doi))
  WHERE doi IS NOT NULL;
