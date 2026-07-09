-- Run this SQL in your Supabase project (SQL Editor) to create the baseball_teams table.

CREATE TABLE IF NOT EXISTS baseball_teams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_name TEXT,
  league_tier TEXT,
  league TEXT,
  website TEXT,
  instagram_handle TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  outreach_tier TEXT DEFAULT 'not_engaged',
  status TEXT DEFAULT 'none',
  called BOOLEAN DEFAULT false,
  emailed BOOLEAN DEFAULT false,
  sales_nav BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT baseball_teams_team_name_unique UNIQUE (team_name)
);

-- Trigger to set updated_at on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS baseball_teams_updated_at ON baseball_teams;
CREATE TRIGGER baseball_teams_updated_at
  BEFORE UPDATE ON baseball_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Optional: enable RLS and add policy for anon read/write (adjust as needed for your auth)
-- ALTER TABLE baseball_teams ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anon read/write" ON baseball_teams FOR ALL USING (true) WITH CHECK (true);
