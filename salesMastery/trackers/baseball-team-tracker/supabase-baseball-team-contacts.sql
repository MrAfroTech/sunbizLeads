-- Run this SQL in your Supabase project after baseball_teams exists.
-- 1) Create baseball_team_contacts table
-- 2) Migrate any existing contact data if needed (optional), then drop columns from baseball_teams

-- Create contacts table
CREATE TABLE IF NOT EXISTS baseball_team_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id BIGINT NOT NULL REFERENCES baseball_teams(id) ON DELETE CASCADE,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baseball_team_contacts_team_id ON baseball_team_contacts(team_id);

-- Remove contact columns from baseball_teams
ALTER TABLE baseball_teams
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone;
