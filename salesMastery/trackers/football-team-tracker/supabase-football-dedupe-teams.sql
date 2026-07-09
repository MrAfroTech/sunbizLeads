-- Dedupe football_teams by normalized team name (matches app: trim, lower, collapse spaces).
-- Keeps the row with the smallest id per group. Reassigns contacts, merges flags, then deletes extras.
-- Run in Supabase SQL Editor (postgres role). Wrap in BEGIN/COMMIT if you want a single transaction.

BEGIN;

-- Normalized key (same idea as normalizeTeamName in the tracker app)
CREATE TEMP TABLE team_norm ON COMMIT DROP AS
SELECT
  id,
  lower(trim(regexp_replace(coalesce(team_name, ''), '\s+', ' ', 'g'))) AS norm
FROM football_teams;

-- Canonical team id per normalized name (non-empty names only)
CREATE TEMP TABLE team_keepers ON COMMIT DROP AS
SELECT norm, MIN(id) AS keep_id
FROM team_norm
WHERE norm <> ''
GROUP BY norm
HAVING COUNT(*) > 1;

-- 1) Point all contacts at the canonical team row
UPDATE football_team_contacts c
SET team_id = k.keep_id
FROM team_norm n
JOIN team_keepers k ON k.norm = n.norm
WHERE c.team_id = n.id
  AND n.id <> k.keep_id;

-- 2) Merge booleans and outreach_tier (OR / engaged wins)
WITH agg AS (
  SELECT
    tk.keep_id,
    bool_or(bt.called) AS any_called,
    bool_or(bt.emailed) AS any_emailed,
    bool_or(bt.sales_nav) AS any_sales_nav,
    bool_or(bt.broken_site_link) AS any_broken_site_link,
    bool_or(bt.outreach_tier = 'engaged') AS any_engaged
  FROM team_keepers tk
  JOIN team_norm n ON n.norm = tk.norm
  JOIN football_teams bt ON bt.id = n.id
  GROUP BY tk.keep_id
)
UPDATE football_teams t
SET
  called = COALESCE(t.called, false) OR agg.any_called,
  emailed = COALESCE(t.emailed, false) OR agg.any_emailed,
  sales_nav = COALESCE(t.sales_nav, false) OR agg.any_sales_nav,
  broken_site_link = COALESCE(t.broken_site_link, false) OR agg.any_broken_site_link,
  outreach_tier = CASE WHEN agg.any_engaged THEN 'engaged' ELSE t.outreach_tier END
FROM agg
WHERE t.id = agg.keep_id;

-- 3) Merge status by priority: none < contacted < replied < meeting_booked
WITH agg AS (
  SELECT
    tk.keep_id,
    MAX(
      CASE COALESCE(trim(bt.status), 'none')
        WHEN 'none' THEN 0
        WHEN 'contacted' THEN 1
        WHEN 'replied' THEN 2
        WHEN 'meeting_booked' THEN 3
        ELSE 0
      END
    ) AS max_pri
  FROM team_keepers tk
  JOIN team_norm n ON n.norm = tk.norm
  JOIN football_teams bt ON bt.id = n.id
  GROUP BY tk.keep_id
)
UPDATE football_teams t
SET status = CASE agg.max_pri
  WHEN 0 THEN 'none'
  WHEN 1 THEN 'contacted'
  WHEN 2 THEN 'replied'
  WHEN 3 THEN 'meeting_booked'
  ELSE COALESCE(trim(t.status), 'none')
END
FROM agg
WHERE t.id = agg.keep_id;

-- 4) Fill empty league_tier, league, website from earliest non-empty value in each duplicate group
WITH fill AS (
  SELECT
    tk.keep_id,
    (SELECT bt.league_tier FROM team_norm n
     JOIN football_teams bt ON bt.id = n.id
     WHERE n.norm = tk.norm AND NULLIF(trim(bt.league_tier), '') IS NOT NULL
     ORDER BY bt.id LIMIT 1) AS league_tier,
    (SELECT bt.league FROM team_norm n
     JOIN football_teams bt ON bt.id = n.id
     WHERE n.norm = tk.norm AND NULLIF(trim(bt.league), '') IS NOT NULL
     ORDER BY bt.id LIMIT 1) AS league,
    (SELECT bt.website FROM team_norm n
     JOIN football_teams bt ON bt.id = n.id
     WHERE n.norm = tk.norm AND NULLIF(trim(bt.website), '') IS NOT NULL
     ORDER BY bt.id LIMIT 1) AS website
  FROM team_keepers tk
)
UPDATE football_teams t
SET
  league_tier = COALESCE(NULLIF(trim(t.league_tier), ''), fill.league_tier),
  league = COALESCE(NULLIF(trim(t.league), ''), fill.league),
  website = COALESCE(NULLIF(trim(t.website), ''), fill.website)
FROM fill
WHERE t.id = fill.keep_id;

-- 5) Delete duplicate team rows (contacts already moved)
DELETE FROM football_teams t
USING team_norm n
JOIN team_keepers k ON k.norm = n.norm
WHERE t.id = n.id
  AND n.id <> k.keep_id;

COMMIT;

-- Rows with empty team_name are not merged by this script (ambiguous). Clean those up manually if needed.
