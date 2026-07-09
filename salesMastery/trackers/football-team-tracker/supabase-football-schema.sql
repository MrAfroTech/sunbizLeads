-- =============================================================================
-- Football tracker tables (Supabase / Postgres)
-- Duplicates the baseball_* schema with football_* names (all-in-one).
-- Modular scripts: supabase-football-teams.sql, supabase-football-team-contacts.sql,
--                   supabase-football-tracker-ui.sql, supabase-football-tracker-ui-rebuild-from-master.sql,
--                   supabase-football-dedupe-teams.sql (optional maintenance)
--
-- Run order: this file as a whole in the SQL Editor (same database as baseball).
--
-- Prerequisites:
--   - None if you rely on the set_updated_at() definition below (idempotent with baseball).
--   - football_team_matches_scraped_exclusion: edit the excluded[] list to match
--     scrapedContactsExcludedCompanies.js when you wire the football app.
-- =============================================================================

-- Trigger helper (shared pattern with baseball; CREATE OR REPLACE is safe if already present)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1) Master: football_teams (same shape as baseball_teams before contact split)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS football_teams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_name TEXT,
  league_tier TEXT,
  league TEXT,
  website TEXT,
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  outreach_tier TEXT DEFAULT 'not_engaged',
  status TEXT DEFAULT 'none',
  called BOOLEAN DEFAULT false,
  emailed BOOLEAN DEFAULT false,
  sales_nav BOOLEAN DEFAULT false,
  broken_site_link BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT football_teams_team_name_unique UNIQUE (team_name)
);

DROP TRIGGER IF EXISTS football_teams_updated_at ON football_teams;
CREATE TRIGGER football_teams_updated_at
  BEFORE UPDATE ON football_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2) Master: football_team_contacts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS football_team_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id BIGINT NOT NULL REFERENCES football_teams(id) ON DELETE CASCADE,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_football_team_contacts_team_id ON football_team_contacts(team_id);

-- Match post-migration baseball_teams: drop embedded contact columns from football_teams
ALTER TABLE football_teams
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone;

-- -----------------------------------------------------------------------------
-- 3) UI helper: exclusion filter (rename + own copy; customize list for football)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION football_team_matches_scraped_exclusion(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  n TEXT;
  h TEXT;
  excluded TEXT[] := ARRAY[
    'rubber ducks', 'curve', 'sea wolves', 'senators', 'goats', 'fisher cats', 'sea dogs',
    'flying squirrels', 'patriots', 'thunder', 'barons', 'shuckers', 'lookouts', 'blue wahoos',
    'smokies', 'sod poodles', 'travelers', 'hooks', 'rough riders', 'rockhounds', 'naturals',
    'missions', 'cardinals', 'drillers', 'wind surge', 'iron birds', 'hot rods', 'renegardes',
    'renegades', 'red sox', 'blue rocks', 'dash', 'tourists', 'grasshoppers', 'grasshopers',
    'kernels', 'dragons', 'loons', 'cougars', 'captains', 'lug nuts', 'chiefs', 'river bandits',
    'cubs', 'whitecaps', 'white caps', 'rattlers', 'emeralds', 'aquasox', 'hops', 'indians',
    'canadians', 'green jackets', 'fireflies', 'shorebirds', 'woodpeckers', 'nationals',
    'crawdads', 'cannon balls', 'hillcats', 'pelicans', 'mauraders', 'marauders', 'threshers',
    'tortuges', 'tortugas', 'blue jays', 'hammerheads', 'mets', 'tarpons', '66ers', 'quakes',
    'storm', 'rawhide', 'otters', 'y''alls', 'wild cats', 'wild things', 'boxcars', 'redhawks',
    'titans', 'dirty birds', 'dogs', 'goldeyes', 'mustangs', 'chuckers', 'chukars', 'hawks',
    'usbpl', 'uspbl'
  ];
BEGIN
  n := lower(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
  IF n = '' THEN
    RETURN false;
  END IF;
  FOREACH h IN ARRAY excluded
  LOOP
    IF h = '' THEN
      CONTINUE;
    END IF;
    IF n = h THEN
      RETURN true;
    END IF;
    IF length(n) > length(h) AND right(n, length(h)) = h
       AND substring(n from length(n) - length(h) for 1) = ' ' THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4) UI: football_teams_ui, football_team_contacts_ui
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS football_teams_ui (
  id BIGINT PRIMARY KEY,
  team_name TEXT,
  league_tier TEXT,
  league TEXT,
  website TEXT,
  outreach_tier TEXT DEFAULT 'not_engaged',
  status TEXT DEFAULT 'none',
  called BOOLEAN DEFAULT false,
  emailed BOOLEAN DEFAULT false,
  sales_nav BOOLEAN DEFAULT false,
  broken_site_link BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT football_teams_ui_team_name_unique UNIQUE (team_name)
);

DROP TRIGGER IF EXISTS football_teams_ui_updated_at ON football_teams_ui;
CREATE TRIGGER football_teams_ui_updated_at
  BEFORE UPDATE ON football_teams_ui
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS football_team_contacts_ui (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id BIGINT NOT NULL REFERENCES football_teams_ui(id) ON DELETE CASCADE,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_football_team_contacts_ui_team_id ON football_team_contacts_ui(team_id);

-- Optional RLS (same as baseball template; uncomment and adjust policies as needed)
-- ALTER TABLE football_teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE football_team_contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE football_teams_ui ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE football_team_contacts_ui ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5) OPTIONAL: Rebuild UI tables from master (destructive for football_*_ui)
-- Run only when you want football_teams_ui / football_team_contacts_ui to mirror master.
-- =============================================================================
/*
TRUNCATE football_teams_ui CASCADE;

INSERT INTO football_teams_ui (
  id, team_name, league_tier, league, website, outreach_tier, status,
  called, emailed, sales_nav, broken_site_link, created_at, updated_at
)
SELECT
  id, team_name, league_tier, league, website, outreach_tier, status,
  called, emailed, sales_nav, broken_site_link, created_at, updated_at
FROM football_teams;

INSERT INTO football_team_contacts_ui (id, team_id, contact_name, phone, email, created_at)
SELECT id, team_id, contact_name, phone, email, created_at
FROM football_team_contacts;

DELETE FROM football_teams_ui t
WHERE football_team_matches_scraped_exclusion(t.team_name);
*/
