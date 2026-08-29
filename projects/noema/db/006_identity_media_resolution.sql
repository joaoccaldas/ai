-- NOEMA v1 identity and media resolution spine.
-- Identity labels and visual assets remain reviewable provenance objects rather than
-- unstructured properties on an entity card.

CREATE TABLE IF NOT EXISTS entity_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  language_code text,
  script_code text,
  name_type text NOT NULL DEFAULT 'ALIAS',
  transliteration_system text,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  valid_time_start_min integer,
  valid_time_start_max integer,
  valid_time_end_min integer,
  valid_time_end_max integer,
  review_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(entity_id, name, language_code, script_code, name_type),
  CHECK (name_type IN ('PREFERRED','ALIAS','EMIC','EXONYM','HISTORICAL','TRANSLITERATION','EPITHET','TITLE')),
  CHECK (review_status IN ('PENDING_REVIEW','APPROVED','REJECTED','DISPUTED'))
);

CREATE TABLE IF NOT EXISTS entity_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  authority text NOT NULL,
  external_id text NOT NULL,
  canonical_url text,
  link_type text NOT NULL DEFAULT 'IDENTITY_CANDIDATE',
  confidence numeric(5,4),
  review_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(authority, external_id, entity_id),
  CHECK (link_type IN ('IDENTITY_CANDIDATE','SAME_AS','HISTORICAL_VARIANT','CLOSE_MATCH','BROADER_CONCEPT','NARROWER_CONCEPT','COUNTERPART_NOT_IDENTITY')),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  CHECK (review_status IN ('PENDING_REVIEW','APPROVED','REJECTED','DISPUTED'))
);

CREATE TABLE IF NOT EXISTS entity_resolution_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  right_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  decision text NOT NULL,
  rationale text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (left_entity_id <> right_entity_id),
  CHECK (decision IN ('MERGE','KEEP_SEPARATE','HISTORICAL_VARIANT_OF','COUNTERPART_NOT_IDENTITY','NEEDS_MORE_EVIDENCE'))
);

CREATE TABLE IF NOT EXISTS media_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_fingerprint text NOT NULL UNIQUE,
  entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  entity_external_id text,
  provider text NOT NULL,
  provider_page_id text,
  provider_title text,
  search_query text,
  source_page_url text NOT NULL,
  media_url text NOT NULL,
  thumbnail_url text,
  creator text,
  credit text,
  license text,
  license_url text,
  usage_terms text,
  description text,
  rights_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  identity_match_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  rights_review_status text NOT NULL DEFAULT 'PENDING_REVIEW',
  decision text NOT NULL DEFAULT 'PENDING_REVIEW',
  reviewer text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (identity_match_status IN ('PENDING_REVIEW','MATCH','MISMATCH','AMBIGUOUS')),
  CHECK (rights_review_status IN ('PENDING_REVIEW','APPROVED','RESTRICTED','REJECTED')),
  CHECK (decision IN ('PENDING_REVIEW','APPROVED_FOR_ENTITY_MEDIA','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_entity_names_lookup ON entity_names(entity_id, review_status, name_type);
CREATE INDEX IF NOT EXISTS idx_identity_links_entity ON entity_identity_links(entity_id, authority, review_status);
CREATE INDEX IF NOT EXISTS idx_resolution_decisions_pair ON entity_resolution_decisions(left_entity_id, right_entity_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_candidates_review ON media_candidates(decision, identity_match_status, rights_review_status, provider);
