-- Rebuild football_teams_ui + football_team_contacts_ui from master tables, then remove scraped-CSV teams.
-- Destructive for UI tables. Run after supabase-football-tracker-ui.sql. Re-run when you want a full resync from master.

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
