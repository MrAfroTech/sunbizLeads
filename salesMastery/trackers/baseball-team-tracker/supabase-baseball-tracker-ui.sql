-- Tracker UI tables: same shape as baseball_teams / baseball_team_contacts, but only teams not in the scraped CSV.
-- Master tables baseball_teams + baseball_team_contacts stay the full list.
-- Run in Supabase SQL Editor after baseball_teams, baseball_team_contacts, and set_updated_at() exist.
--
-- Exclusion labels must stay in sync with scrapedContactsExcludedCompanies.js (SCRAPED_EXCLUDED_COMPANIES).
-- After this file, run supabase-baseball-tracker-ui-rebuild-from-master.sql once to copy data and remove excluded teams.

CREATE OR REPLACE FUNCTION baseball_team_matches_scraped_exclusion(p_name TEXT)
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

CREATE TABLE IF NOT EXISTS baseball_teams_ui (
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
  CONSTRAINT baseball_teams_ui_team_name_unique UNIQUE (team_name)
);

DROP TRIGGER IF EXISTS baseball_teams_ui_updated_at ON baseball_teams_ui;
CREATE TRIGGER baseball_teams_ui_updated_at
  BEFORE UPDATE ON baseball_teams_ui
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS baseball_team_contacts_ui (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id BIGINT NOT NULL REFERENCES baseball_teams_ui(id) ON DELETE CASCADE,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baseball_team_contacts_ui_team_id ON baseball_team_contacts_ui(team_id);
