# Supabase Table Usage Audit

**Project:** `smqwemfobrqxnpcooigd`  
**Schema:** `public`  
**Audit date:** 2026-06-13  
**Scope:** `SeamlessVendorUI/seamlesslyUs`, `salesMastery/` (incl. `sql/`, `leadManagement/revops/`, `playwrightAutomation/`, `trackers/`, `eCommerceSite/scan-and-scale/`, `chaosMastery/chaos-mastery-web/`), and related monorepo paths.

**Method:** Full-text codebase search for table names, `.from('…')` Supabase calls, SQL migrations/views, Edge Functions, Vercel API routes, cron docs, and live row counts + RLS status from Postgres.

**No tables were modified.** Classification only.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | **ACTIVE — Core Lead Engine** — Written and read by unified lead engine v2; required for production automation |
| 🟡 | **ACTIVE — Supporting / Analytics** — Live writes and/or dashboard reads; not canonical lead pipeline |
| 🟠 | **ORPHANED — Has Data, No Active Code Path** — Rows exist; no current app/Edge/cron reference |
| 🔴 | **DEAD — No Data, No Active Code Path** — Empty and unreferenced; drop candidate after confirmation |
| **UNRESTRICTED** | RLS disabled (`relrowsecurity = false`) — review before any public exposure |

---

## Regular Tables

| Table | Rows | Classification | Written By | Read By | Last Known Active | Action |
|-------|------|----------------|------------|---------|-------------------|--------|
| `scan_and_scale_click_events` | 38 | 🟢 Core Lead Engine | Frontend: `seamlesslyUs/src/lib/scanAndScaleClickEvent.js`, `api/log-site-event.js`; Edge: `on-lead-submit`, `ingest-lead-event`, `score-lead`, `send-followup-emails`; scan-and-scale `logSiteEvent.js` | Edge: `score-lead`, `send-followup-emails`, `ingest-lead-event`; DB webhook → `on-lead-submit` | 2026 (unified lead engine v2) | **Keep** — canonical lead table |
| `lead_events` | 71 | 🟢 Core Lead Engine | Edge: `ingest-lead-event` (via `seamlesslyUs/api/ingest-lead-event.js` + `useLeadEventTracker`), `on-lead-submit` | Edge: `score-lead` | 2026 | **Keep** |
| `follow_up_tasks` | 27 | 🟢 Core Lead Engine | Edge: `on-lead-submit`, legacy `on-new-click-event`, `on-calculator-form-submit` | Manual SQL only (SOPs / Supabase editor) | 2026 | **Keep** — service-role only |
| `calculator_engagement_events` | 194 | 🟡 Supporting / Analytics | Edge: `track-calculator-event`; anon INSERT policy exists | Views: `calculator_ab_*`, `org_funnel_scores`; `score-lead` (indirect via funnel) | 2026 | **Keep** |
| `calculator_page_visits` | 655 | 🟡 Supporting / Analytics | Frontend: `seamlesslyUs/src/lib/calculatorPageVisits.js` | Views: `org_funnel_contacts`, `org_funnel_scores`, `calculator_ab_*` | 2026 | **Keep** |
| `brevo_contacts` | 4,961 | 🟡 Supporting / Analytics | Frontend: `seamlesslyUs/src/lib/emailClicks.js`; API: `chaos-mastery-web/backend/api/logEmailClick.js`; one-time script: `playwrightAutomation/scripts/brevo-backfill.js` | View: `org_funnel_contacts` | 2026 | **Keep** — email click attribution |
| `scan_and_scale_site_events` | 235 | 🟡 Supporting / Analytics | API: `scan-and-scale/backend/api/logSiteEvent.js`, `seamlesslyUs/api/log-site-event.js` (append-only) | No dashboard; analytics / manual SQL | 2025–2026 | **Keep** — site analytics |
| `sports_revenue_game_journeys` | 17 | 🟡 Supporting / Analytics | Frontend: `seamlesslyUs/src/lib/sportsRevenueJourney.js` | No dedicated dashboard | 2026 | **Keep** |
| `staff_turnover_calculator_journeys` | 0 | 🟡 Supporting / Analytics | Frontend: `seamlesslyUs/src/lib/staffJourneys.js` | No dashboard | 2026 (code live; no rows yet) | **Keep** — monitor traffic |
| `staff_burnout_results_journeys` | 0 | 🟡 Supporting / Analytics | Frontend: `seamlesslyUs/src/lib/staffJourneys.js` | No dashboard | 2026 (code live; no rows yet) | **Keep** — monitor traffic |
| `org_funnel_snapshots` | 10 | 🟡 Supporting / Analytics | Edge cron: `daily-org-funnel-snapshot` | No app reads (write-only archive) | 2026 | **Keep** — trend archive |
| `baseball_teams` | 224 | 🟡 Supporting / Analytics | Tracker CSV import: `trackers/baseball-team-tracker/baseball-tracker.jsx`; legacy: `midsizeAndUpEventSpaces/baseball-tracker.jsx` | Same trackers (master sync → `*_ui`) | Outbound prospecting tool | **Keep** — enable RLS |
| `baseball_teams_ui` | 95 | 🟡 Supporting / Analytics | Tracker: `baseball-tracker.jsx` (daily outreach UI) | Same | Outbound prospecting | **Keep** — enable RLS |
| `football_teams` | 563 | 🟡 Supporting / Analytics | Tracker CSV import: `trackers/football-team-tracker/football-tracker.jsx` | Same (+ sync to `football_teams_ui`) | Outbound prospecting | **Keep** — enable RLS |
| `football_teams_ui` | 516 | 🟡 Supporting / Analytics | Tracker: `football-tracker.jsx` | Same | Outbound prospecting | **Keep** — enable RLS |
| `baseball_team_contacts` | 25 | 🟠 ORPHANED | Legacy only: `midsizeAndUpEventSpaces/baseball-tracker.jsx` (superseded) | Legacy tracker only | Pre–`*_ui` split | **Archive** — data migrated to UI pattern |
| `baseball_team_contacts_ui` | 0 | 🟡 Supporting / Analytics | Tracker: `baseball-tracker.jsx` | Same | 2026 (code live) | **Keep** — enable RLS |
| `football_team_contacts_ui` | 0 | 🟡 Supporting / Analytics | Tracker: `football-tracker.jsx` | Same | 2026 (code live) | **Keep** — enable RLS |
| `multi_vendor_food_halls` | 112 | 🟠 ORPHANED | No code path found (likely manual SQL / one-time enrichment) | None | Unknown — no repo reference | **Archive** — export then drop |
| `football_team_contacts` | 0 | 🔴 DEAD | SQL migrations only; current tracker uses `football_team_contacts_ui` | None | Never adopted in app code | **Drop** after confirm |
| `main_street_page_visits` | 0 | 🔴 DEAD | None — schema mirrors `calculator_page_visits` but unused | None | Abandoned; Main Street uses `scan_and_scale_*` instead | **Drop** after confirm |

### Truncated names resolved

| Dashboard truncation | Full name |
|---------------------|-----------|
| `baseball_teams_ui` | `baseball_teams_ui` |
| `football_team_con_...` | `football_team_contacts` (master, empty) |
| `football_team_con_...` (second) | `football_team_contacts_ui` |
| `main_street_page_...` | `main_street_page_visits` |
| `multi_vendor_foo_...` | `multi_vendor_food_halls` |

---

## Views (read-only, derived)

| View | Classification | Written By | Read By | Last Known Active | Action |
|------|----------------|------------|---------|-------------------|--------|
| `org_funnel_scores` | 🟡 Supporting / Analytics | N/A (view) | `leadManagement/revops/OrgFunnelDashboard.jsx`; Edge: `daily-org-funnel-snapshot` | 2026 | **Keep** |
| `org_funnel_contacts` | 🟡 Supporting / Analytics | N/A (view) | `OrgFunnelDashboard.jsx` | 2026 | **Keep** |
| `calculator_ab_variant_report` | 🟡 Supporting / Analytics | N/A (view) | `leadManagement/revops/CalculatorAbDashboard.jsx` | 2026 | **Keep** |
| `calculator_ab_persona_report` | 🟡 Supporting / Analytics | N/A (view) | `CalculatorAbDashboard.jsx` | 2026 | **Keep** |
| `calculator_ab_ordering_report` | 🟡 Supporting / Analytics | N/A (view) | `CalculatorAbDashboard.jsx` | 2026 | **Keep** |
| `calculator_ab_lead_score_by_variant` | 🟡 Supporting / Analytics | N/A (view) | `CalculatorAbDashboard.jsx` | 2026 | **Keep** |

**View definitions:** `salesMastery/sql/org_funnel_scores_view.sql`, `salesMastery/sql/calculator_ab_attribution.sql`

**Base tables consumed by views:** `calculator_page_visits`, `calculator_engagement_events`, `brevo_contacts`

---

## Cross-cutting findings

### Unified Lead Engine v2 (🟢 core path)

```
Frontend (seamlesslyUs)
  ├─ scanAndScaleClickEvent.js ──INSERT/UPDATE──► scan_and_scale_click_events (engine_version v2)
  ├─ useLeadEventTracker ──POST──► /api/ingest-lead-event ──► ingest-lead-event ──► lead_events
  └─ DB webhook INSERT on scan_and_scale_click_events ──► on-lead-submit
        ├─► follow_up_tasks (if phone)
        ├─► lead_events
        └─► Brevo + owner notification

Cron: send-followup-emails ──reads/updates──► scan_and_scale_click_events
Cron: daily-org-funnel-snapshot ──reads──► org_funnel_scores ──writes──► org_funnel_snapshots
Edge: score-lead ──reads──► lead_events, scan_and_scale_click_events
```

### Outbound sports prospecting (separate from lead engine)

- **Active tools:** `salesMastery/trackers/baseball-team-tracker/` and `football-team-tracker/` React apps.
- **Pattern:** CSV import → master `*_teams` → sync subset to `*_teams_ui`; contacts CRUD on `*_team_contacts_ui` only.
- **Playwright:** `playwrightAutomation/scrape-mailto-advanced.py` references `football_teams.csv` (local file, not DB writes).
- **Not part of lead engine v2** — classify as 🟡 outbound tooling, not 🟢.

### Main Street funnel

- Uses `scan_and_scale_click_events` + `scan_and_scale_site_events` via `POST /api/log-site-event` — **not** `main_street_page_visits`.
- `main_street_page_visits` appears to be an abandoned parallel of `calculator_page_visits`.

### `multi_vendor_food_halls`

- 112 rows with venue/operator prospecting columns.
- **Zero** references in any `.js`, `.jsx`, `.ts`, `.sql` migration, or Playwright script in the monorepo.
- Treat as one-time manual enrichment artifact.

---

## Recommended action list (priority order)

### 1. Tables safe to DROP immediately (🔴 only)

Confirm in Supabase SQL editor, then drop:

| Table | Rows | Rationale |
|-------|------|-----------|
| `main_street_page_visits` | 0 | Duplicate schema; Main Street uses `scan_and_scale_*` |
| `football_team_contacts` | 0 | Superseded by `football_team_contacts_ui`; only SQL DDL references |

```sql
-- Run only after manual confirmation
-- DROP TABLE IF EXISTS public.main_street_page_visits;
-- DROP TABLE IF EXISTS public.football_team_contacts;
```

### 2. Tables to ARCHIVE (🟠)

| Table | Rows | Suggested action |
|-------|------|------------------|
| `multi_vendor_food_halls` | 112 | `COPY` to CSV → `archive` schema or S3 → drop from `public` |
| `baseball_team_contacts` | 25 | Export → verify data exists in `baseball_team_contacts_ui` or master rebuild scripts → drop master contacts table if redundant |

### 3. Tables to leave but ADD RLS (🟡/🟢 with UNRESTRICTED)

These tables have **RLS disabled** and are reachable via the anon key if grants exist:

| Table | Rows | Risk | Recommendation |
|-------|------|------|----------------|
| `baseball_teams` | 224 | Full read/write if granted | Enable RLS; anon/authenticated policies for tracker only |
| `baseball_teams_ui` | 95 | Same | Same |
| `baseball_team_contacts_ui` | 0 | Same | Same |
| `football_teams` | 563 | Same | Same |
| `football_teams_ui` | 516 | Same | Same |
| `football_team_contacts_ui` | 0 | Same | Same |
| `multi_vendor_food_halls` | 112 | **High** — prospect PII | Archive first; if kept, service-role only |
| `main_street_page_visits` | 0 | Low (empty) | Drop instead |

**Views** (`org_funnel_*`, `calculator_ab_*`): Postgres views show `relrowsecurity = false`. In Postgres 15+, confirm `security_invoker = true` on view definitions so RLS on base tables applies. Definitions live in `salesMastery/sql/`.

### 4. Core tables — no action needed (🟢)

| Table | RLS |
|-------|-----|
| `scan_and_scale_click_events` | ✅ Enabled |
| `lead_events` | ✅ Enabled |
| `follow_up_tasks` | ✅ Enabled (no anon policies — service role only) |

### 5. Supporting tables — no drop; monitor (🟡)

Keep: `calculator_page_visits`, `calculator_engagement_events`, `brevo_contacts`, `scan_and_scale_site_events`, `sports_revenue_game_journeys`, `staff_*_journeys`, `org_funnel_snapshots`, all views, outbound `*_teams*` UI tables.

---

## RLS summary

### Tables with RLS **enabled** (no action unless policies are too permissive)

`brevo_contacts`, `calculator_engagement_events`, `calculator_page_visits`, `follow_up_tasks`, `lead_events`, `org_funnel_snapshots`, `scan_and_scale_click_events`, `scan_and_scale_site_events`, `sports_revenue_game_journeys`, `staff_burnout_results_journeys`, `staff_turnover_calculator_journeys`

> Note: Several 🟡 tables use `anon` INSERT/UPDATE policies with `USING (true)` — intentional for public calculators but worth periodic review.

### Tables with RLS **disabled** (UNRESTRICTED badge)

`baseball_teams`, `baseball_teams_ui`, `baseball_team_contacts`, `baseball_team_contacts_ui`, `football_teams`, `football_teams_ui`, `football_team_contacts`, `football_team_contacts_ui`, `main_street_page_visits`, `multi_vendor_food_halls`

---

## Edge Functions & crons touching audited tables

| Function | Tables touched | Trigger |
|----------|----------------|---------|
| `on-lead-submit` | `scan_and_scale_click_events`, `follow_up_tasks`, `lead_events` | DB webhook + frontend POST |
| `ingest-lead-event` | `lead_events`, `scan_and_scale_click_events` | Frontend POST |
| `score-lead` | `lead_events`, `scan_and_scale_click_events` | Invoked by automation |
| `send-followup-emails` | `scan_and_scale_click_events` | Daily cron |
| `track-calculator-event` | `calculator_engagement_events` | `calculator-tracker.js` |
| `daily-org-funnel-snapshot` | `org_funnel_scores` (read), `org_funnel_snapshots` (write) | Daily cron |
| `on-new-click-event` (legacy v1) | `scan_and_scale_click_events`, `follow_up_tasks` | Webhook filter `engine_version = 'v1'` |

---

## Repos searched

| Path | Relevant artifacts |
|------|-------------------|
| `SeamlessVendorUI/seamlesslyUs/` | Journey libs, calculators, `api/log-site-event.js`, `api/ingest-lead-event.js`, SQL migrations |
| `salesMastery/sql/` | View definitions, A/B attribution, org funnel snapshots |
| `salesMastery/leadManagement/revops/` | `OrgFunnelDashboard.jsx`, `CalculatorAbDashboard.jsx` |
| `salesMastery/supabase/functions/` | Unified lead engine Edge Functions |
| `salesMastery/playwrightAutomation/scripts/` | DDL for `brevo_contacts`, `scan_and_scale_*`; `brevo-backfill.js` |
| `salesMastery/eCommerceSite/scan-and-scale/` | `logSiteEvent.js`, funnel Edge Functions |
| `salesMastery/chaosMastery/chaos-mastery-web/` | `logEmailClick.js` → `brevo_contacts` |
| `salesMastery/trackers/*-team-tracker/` | Baseball/football outbound trackers |
| `salesMastery/midsizeAndUpEventSpaces/` | Legacy baseball tracker (master contacts) |

**Not found in repo:** Any application code referencing `multi_vendor_food_halls` or `main_street_page_visits`.

---

*Generated by automated codebase + Supabase audit. No schema changes were made.*
