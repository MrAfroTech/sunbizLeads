-- Florida Multi-Location Operators - Supabase Schema
-- Run in Supabase SQL Editor after dropping old tables if migrating

-- Drop old single-location tables if they exist (migration)
DROP VIEW IF EXISTS enrichment_failures;
DROP VIEW IF EXISTS today_stats;
DROP VIEW IF EXISTS ready_to_sync;
DROP VIEW IF EXISTS incomplete_leads;
DROP TABLE IF EXISTS brevo_sync;
DROP TABLE IF EXISTS agent_log;
DROP TABLE IF EXISTS enrichment;
DROP TABLE IF EXISTS businesses;

-- Multi-location operators (10+ locations)
CREATE TABLE multi_location_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  document_number TEXT UNIQUE,
  category TEXT NOT NULL,
  estimated_location_count INT NOT NULL DEFAULT 0,
  location_count_source TEXT,
  sunbiz_indicators JSONB DEFAULT '{}',
  parent_company TEXT,
  website TEXT,
  hq_city TEXT,
  hq_state TEXT DEFAULT 'FL',
  pos_system TEXT,
  pos_confidence TEXT,
  expansion_signals JSONB DEFAULT '[]',
  expansion_score INT,
  is_qualified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operators_category ON multi_location_operators(category);
CREATE INDEX idx_operators_location_count ON multi_location_operators(estimated_location_count);
CREATE INDEX idx_operators_expansion_score ON multi_location_operators(expansion_score);
CREATE INDEX idx_operators_is_qualified ON multi_location_operators(is_qualified);

-- Decision makers per operator
CREATE TABLE decision_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES multi_location_operators(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  data_sources JSONB DEFAULT '[]',
  email_confidence TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  synced_to_brevo BOOLEAN DEFAULT FALSE,
  brevo_contact_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_decision_makers_company_email ON decision_makers(company_id, email);
CREATE INDEX idx_decision_makers_company ON decision_makers(company_id);
CREATE INDEX idx_decision_makers_email ON decision_makers(email);
CREATE INDEX idx_decision_makers_synced ON decision_makers(synced_to_brevo);

-- Run history (updated for multi-location)
CREATE TABLE run_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL,
  multi_location_operators_found INT DEFAULT 0,
  decision_makers_found INT DEFAULT 0,
  categories_breakdown JSONB DEFAULT '{}',
  avg_locations_per_operator NUMERIC(10,2),
  expansion_signals_detected INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  cost_estimate_usd NUMERIC(10,4) DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_run_history_run_date ON run_history(run_date);

-- Views
CREATE OR REPLACE VIEW operators_by_category AS
SELECT category,
  COUNT(*) AS operator_count,
  SUM(estimated_location_count)::INT AS total_locations,
  ROUND(AVG(estimated_location_count), 2) AS avg_locations
FROM multi_location_operators
WHERE is_qualified = TRUE
GROUP BY category;

CREATE OR REPLACE VIEW ready_for_outreach AS
SELECT dm.*, o.company_name, o.category, o.estimated_location_count, o.expansion_score, o.website, o.hq_city, o.hq_state, o.pos_system
FROM decision_makers dm
JOIN multi_location_operators o ON o.id = dm.company_id
WHERE dm.email IS NOT NULL AND dm.email != ''
  AND dm.synced_to_brevo = FALSE
  AND o.is_qualified = TRUE
ORDER BY o.expansion_score DESC NULLS LAST, o.estimated_location_count DESC;

CREATE OR REPLACE VIEW category_performance AS
SELECT o.category,
  COUNT(DISTINCT o.id) AS operators,
  COUNT(dm.id) FILTER (WHERE dm.email IS NOT NULL) AS with_email,
  COUNT(dm.id) FILTER (WHERE dm.synced_to_brevo) AS synced
FROM multi_location_operators o
LEFT JOIN decision_makers dm ON dm.company_id = o.id
WHERE o.is_qualified = TRUE
GROUP BY o.category;
