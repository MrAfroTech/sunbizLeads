# Week 1 Agent Review — Full Table Audit

**Project:** `smqwemfobrqxnpcooigd` (salesMastery)  
**Generated:** 2026-06-23  
**Method:** Read-only SQL via Supabase MCP (`execute_sql`)

---

```
════════════════════════════════════════
WEEK 1 AGENT REVIEW — FULL TABLE AUDIT
2026-06-23
════════════════════════════════════════

[TABLE INVENTORY]

 table_name                          | total_rows | v2_rows | v1_rows | last_activity
-------------------------------------+------------+---------+---------+------------------------------
 lead_events                         |        466 |         |         | 2026-06-23 20:17:09.891241+00
 calculator_page_visits              |        975 |         |         | 2026-06-23 20:17:09.689929+00
 scan_and_scale_site_events          |        499 |         |         | 2026-06-23 14:34:13.092226+00
 calculator_engagement_events        |        199 |         |         | 2026-06-18 13:14:36.758748+00
 sports_revenue_game_journeys        |         23 |         |         | 2026-06-18 13:14:34.973992+00
 scan_and_scale_click_events         |         39 |       5 |      34 | 2026-06-14 10:00:45.342033+00
 follow_up_tasks                     |         29 |         |         | 2026-06-14 01:32:37.852453+00
 org_funnel_snapshots                |         10 |         |         | 2026-06-11 10:06:38.652449+00
 brevo_contacts                      |       4961 |         |         | 2026-05-02 04:59:45.02+00
 staff_burnout_results_journeys      |          0 |         |         | (null)
 staff_turnover_calculator_journeys  |          0 |         |         | (null)

[LEAD EVENTS — LINKED VS ORPHANED]

 link_status | count | unique_emails
-------------+-------+---------------
 linked      |    98 |             6
 orphaned    |   368 |             0

[FOLLOW UP TASKS]

 task_type | status  | total | oldest                       | newest
-----------+---------+-------+------------------------------+------------------------------
 call      | pending |    29 | 2026-05-17 01:25:05.185079+00 | 2026-06-14 01:32:37.852453+00

[SUBMIT GAP — POST-FIX CHECK]

 (no rows — zero submissions in scan_and_scale_click_events since 2026-06-20)

 day | lead_source | engine_version | submissions | avg_score | scored
-----+-------------+----------------+-------------+-----------+--------

 Supplementary: lead_events `lead_submitted` since 2026-06-20 → 0 events

[NURTURE SEQUENCE HEALTH — v2 only]

 emails_sent | funnel_stage  | leads | earliest_lead                | latest_lead
-------------+---------------+-------+------------------------------+------------------------------
           1 | email_1_sent  |     4 | 2026-06-13 11:51:50.57044+00 | 2026-06-13 15:18:49.451761+00
           4 | email_4_sent  |     1 | 2026-05-16 23:21:44.002104+00 | 2026-05-16 23:21:44.002104+00

[V1 DRAIN STATUS]

 emails_sent | leads | latest_lead
-------------+-------+------------------------------
           4 |    30 | 2026-06-01 14:18:03.993247+00
           1 |     1 | 2026-06-14 10:00:45.342033+00
           0 |     3 | 2026-05-16 15:32:10.479466+00

════════════════════════════════════════
FLAGS
════════════════════════════════════════

**Tables with 0 rows (expected activity unclear)**
- `staff_burnout_results_journeys` — 0 rows, no last activity
- `staff_turnover_calculator_journeys` — 0 rows, no last activity
  (May be unused calculators or not yet deployed; no traffic signal.)

**Tables with stale activity vs. live engagement**
- `scan_and_scale_click_events` — last row 2026-06-14, but `lead_events` and
  `calculator_page_visits` are active today (2026-06-23). Engagement is flowing;
  lead creation in the canonical table is not.
- `brevo_contacts` — last updated 2026-05-02; may be sync-on-write only or stale
  integration path.

**v2 leads with intent_score = 0 (4 of 5 total)**
- team1a@team.com (wait_calculator) — 2026-06-13
- test@test2.com (wait_calculator) — 2026-06-13
- test@twst2.com (wait_calculator) — 2026-06-13
- no@no.com (wait_calculator) — 2026-06-13
  (All pre-fix leads; 1 v2 lead scored HOT at 68 — sports_calculator.)

**follow_up_tasks with status outside pending/completed**
- None — all 29 tasks are `call` / `pending`.

**v1 drain status**
- **Still in progress.** 34 v1 leads total:
  - 30 at emails_sent = 4 (sequence largely complete)
  - 1 at emails_sent = 1 (latest v1 lead: 2026-06-14)
  - 3 at emails_sent = 0 (never entered nurture)
- No new v1 leads since 2026-06-14; drain is winding down but 4 leads remain
  below emails_sent = 4.

**Submit gap — Issue 3 resolution**
- **NOT confirmed / NOT resolved.** Zero new rows in `scan_and_scale_click_events`
  since 2026-06-20 (and none since 2026-06-14 overall). Zero `lead_submitted`
  events in `lead_events` since 2026-06-20.
- The scoring fix cannot be validated on fresh v2 traffic — no post-fix submissions
  exist. Top-of-funnel engagement (`calculator_page_visits`, `lead_events`) is
  healthy and current; the break appears to be between submit and
  `scan_and_scale_click_events` insert, not in scoring alone.

════════════════════════════════════════
```

---

## Issue 3 — Submit Gap Root Cause (Final)

**Investigation date:** 2026-06-23  
**Status:** Root cause identified, fix applied locally, **production deploy pending**

### Root cause (Step 2 — call stack)

The break was **not** Supabase env vars, RLS, or missing v2 code. Three layered bugs in the frontend submit path:

| Check | Result |
|---|---|
| Step 1 — v2 capture code in build | **PASS** — `engine_version: 'v2'` in `scanAndScaleClickEvent.js`; imported in `submitUnifiedLead.js`; bundle embeds `smqwemfobrqxnpcooigd` URL |
| Step 2 — call stack / await | **FAIL (root cause)** — see below |
| Step 3 — Vercel prod env vars | **PASS** — `REACT_APP_SUPABASE_URL_SALES_MASTERY` + `REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY` set on Production |
| Step 4 — RLS + schema | **PASS** — `anon_insert_scan_and_scale_click_events` policy exists; v2 columns present; `phone` nullable |

**Primary bug:** In `VenueLeakCalculator.js` (powers `/calculator/wait`), `HotelGuestSpendLeakCalculator.js`, and `EventLeakCalculator.js`, `submitUnifiedLead()` was wrapped in `if (phone) { ... }`. Email-only form submits never reached the canonical INSERT.

**Secondary bug:** `recordScanAndScaleLeadCapture()` returned `{ error: 'missing_phone' }` when phone was empty — a hard reject even if the caller did invoke it.

**Tertiary bug:** `recordMilestone('lead_submitted')` fired **after** the submit handler regardless of whether `submitUnifiedLead()` ran or succeeded. This explains 368 orphaned `lead_events` (tracker events with no `lead_id`) while `scan_and_scale_click_events` stayed silent since 2026-06-14.

### Fix applied

| File | Change |
|---|---|
| `src/lib/scanAndScaleClickEvent.js` | Removed `missing_phone` gate; phone optional on insert/update; log `not_configured` in all envs |
| `src/lib/submitUnifiedLead.js` | Added `[submitUnifiedLead]` console logging at each step; fail loudly on missing `lead_id` |
| `src/components/VenueLeakCalculator.js` | Always call `submitUnifiedLead`; only fire `lead_submitted` milestone after success |
| `src/components/HotelGuestSpendLeakCalculator.js` | Same |
| `src/components/EventLeakCalculator.js` | Same |

**Build:** `npm run build` compiled successfully (bundle `main.c802ec6b.js`).

**Deploy:** Completed 2026-06-23 — CLI reported `ETIMEDOUT` while polling, but deployment `dpl_HL8wDvYHk2vfj2a5Q5wTwQSYBdGH` is **Ready** on production (`seamlessly.us`).

### Smoke test

| Test | Result |
|---|---|
| Pre-fix Supabase anon INSERT (with env from `.env`) | **PASS** — row created and deleted |
| Post-fix production row in last 10 min | **N/A** — fix not deployed yet |
| Post-deploy verification query | Run after deploy: |

```sql
SELECT id, email, engine_version, lead_source, intent_score, intent_tier, created_at
FROM scan_and_scale_click_events
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected after deploy + live submit:** 1 new row, `engine_version = 'v2'`, `intent_score > 0` (via `on-lead-submit` → `score-lead`).

### Deploy command

```bash
cd SeamlessVendorUI/seamlesslyUs && vercel --prod
```

Then submit `/calculator/wait` in incognito and re-run the smoke test query above.

