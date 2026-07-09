# Week 1 Lead Engine Health Check

**Project:** `smqwemfobrqxnpcooigd`  
**Generated:** 2026-06-22  
**Method:** Read-only SQL via Supabase MCP (`execute_sql`). No `salesMastery/.env` with service role key was present; subproject `.env` files only contain anon keys.

---

```
════════════════════════════════
WEEK 1 LEAD ENGINE HEALTH CHECK
════════════════════════════════

[1] V2 LEAD VOLUME
 total_v2_leads | owner_notified | email_1_sent | call_tasks_created | phone_captured
----------------+----------------+--------------+--------------------+----------------
              5 |              5 |            5 |                  5 |              5

[2] INTENT SCORE DISTRIBUTION
 intent_tier | count | avg_score | min_score | max_score
-------------+-------+-----------+-----------+----------
 HOT         |     1 |      68.0 |        68 |        68
 COLD        |     4 |       0.0 |         0 |         0

[3] LEAD SOURCE BREAKDOWN
 lead_source      | leads | with_phone | avg_intent_score
------------------+-------+------------+-----------------
 wait_calculator  |     4 |          4 |              0.0
 sports_calculator|     1 |          1 |             68.0

[4] LEAD EVENTS VOLUME + TYPES
 event_name                          | engagement_type  | count
-------------------------------------+------------------+-------
 calculator_viewed                    | view             |   321
 calculator_started                   | interact         |    38
 lead_submitted                       | submit           |    18
 calculator_completed                 | interact         |    16
 cta_clicked                          | interact         |    11
 phone_provided                       | phone_provided   |     9
 consultation_booked                  | phone_provided   |     7
 consultation_cta_clicked             | interact         |     6
 revenue_fit_session_page_view        | interact         |     2
 revenue_fit_session_scheduler_loaded | interact         |     2
 revenue_fit_session_booked           | interact         |     1
 revenue_fit_session_booking_started  | interact         |     1

[5] ENGAGEMENT DEPTH
 avg_events_per_lead | most_engaged_lead | leads_with_3_plus_events
---------------------+-------------------+----------------------------
                13.0 |                48 |                          4

[6] FOLLOW UP TASKS
 task_type | status  | total
-----------+---------+-------
 call      | pending |    12
 (14-day window: created_at >= NOW() - INTERVAL '14 days')

[7] NURTURE SEQUENCE PROGRESSION
 emails_sent | leads_at_this_stage | funnel_stage
-------------+---------------------+----------------
           1 |                   4 | email_1_sent
           4 |                   1 | email_4_sent

[8] V1 VS V2 COEXISTENCE
 engine_version | total | most_recent
----------------+-------+------------------------------
 v1             |    34 | 2026-06-14 10:00:45.342033+00
 v2             |     5 | 2026-06-13 15:18:49.451761+00

[9] UNSCORED LEADS
 unscored_leads | earliest                     | latest
----------------+------------------------------+------------------------------
              4 | 2026-06-13 11:51:50.57044+00 | 2026-06-13 15:18:49.451761+00

[10] DOMAIN ACTIVITY (ACCOUNT SIGNALS)
 (no domains with more than 1 v2 lead)

════════════════════════════════
```

---

## Flags To Watch

| Flag | Status | Detail |
|------|--------|--------|
| `total_v2_leads > 0` but `email_1_sent = 0` → automation not firing | **OK** | 5 v2 leads; all 5 received email 1 |
| `unscored_leads > 0` → `score-lead` gap | **ALERT** | 4 of 5 v2 leads have `intent_score = 0` (all `wait_calculator` source) |
| `leads_at_this_stage` drops to 0 at `emails_sent = 2` → day-2 cron | **WATCH** | No leads at `emails_sent` 2 or 3; 4 at stage 1, 1 jumped to stage 4 |
| Domain appears more than once → account signal | **OK** | No repeat domains among v2 leads |
| `call_tasks_created` << `phone_captured` → call task failure | **OK** | Both are 5 |

---

## Notes

- **V2 volume is small (5 leads)** and last v2 lead was **2026-06-13** — v1 is still active (34 leads, most recent 2026-06-14).
- **Scoring gap is the main issue:** 4/5 v2 leads are COLD with score 0, all from `wait_calculator`. Only `sports_calculator` scored HOT (68).
- **Nurture funnel:** One lead progressed to `email_4_sent` while four remain at `email_1_sent`; stages 2–3 have zero leads — verify day-2/day-3 cron if more volume is expected.
- **Follow-up tasks:** 12 call tasks in the last 14 days, all `status = pending`. Schema uses `status`, not `completed`.

---

## Scoring Gap Fix (2026-06-22)

**Root cause confirmed:** `wait_calculator` components passed `trackerId="calculator-wait"` to `useLeadEventTracker`, so `lead_events.source` did not match `lead_source`. More critically, `score-lead` ran in `on-lead-submit` before session events were linked to the new lead row — events linked later but scores were never recalculated.

**Changes:**
- Removed `trackerId` overrides; trackers now use `pageKey` (`wait_calculator`, `restaurants_calculator`, etc.)
- `on-lead-submit` backfills orphan `lead_events` by `session_id` + `email` before `score-lead`
- Submit handlers fire `lead_submitted` / `phone_provided` after `submitUnifiedLead` succeeds
- `submitUnifiedLead` passes `session_id` and ingests `lead_submitted` on success
- `useLeadEventTracker` uses `meta.email` when provided for event linking

**Deploy:** `supabase functions deploy on-lead-submit --no-verify-jwt` from `salesMastery/supabase`

---

## Follow-Up Queries — 2026-06-22

### Follow-up tasks (14-day, corrected schema)

```sql
SELECT task_type, status, COUNT(*) AS total
FROM follow_up_tasks
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY task_type, status;
```

| task_type | status  | total |
|-----------|---------|-------|
| call      | pending | 12    |

All 12 call tasks in the 14-day window are pending — none completed.

### V2 leads by day

```sql
SELECT DATE(created_at) AS day, COUNT(*) AS leads,
  STRING_AGG(DISTINCT lead_source, ', ') AS sources
FROM scan_and_scale_click_events
WHERE engine_version = 'v2'
GROUP BY DATE(created_at) ORDER BY day DESC;
```

| day        | leads | sources           |
|------------|-------|-------------------|
| 2026-06-13 | 4     | wait_calculator   |
| 2026-05-16 | 1     | sports_calculator |

No new v2 leads since 2026-06-13.

### Calculator page visits since 2026-06-13

```sql
SELECT DATE(created_at) AS day, COUNT(*) AS visits
FROM calculator_page_visits
WHERE created_at >= '2026-06-13'
GROUP BY DATE(created_at) ORDER BY day DESC;
```

| day        | visits |
|------------|--------|
| 2026-06-23 | 9      |
| 2026-06-22 | 17     |
| 2026-06-21 | 19     |
| 2026-06-20 | 22     |
| 2026-06-19 | 8      |
| 2026-06-18 | 9      |
| 2026-06-17 | 22     |
| 2026-06-16 | 27     |
| 2026-06-15 | 46     |
| 2026-06-14 | 112    |
| 2026-06-13 | 34     |

**Interpretation:** Traffic is healthy (200+ visits since 2026-06-13) but v2 form submits stopped on 2026-06-13. This is a **form submit / v2 capture problem**, not a funnel entry problem. Likely causes: v2 submit path not deployed on production, phone gate blocking submits, or leads still routing through v1 capture.
