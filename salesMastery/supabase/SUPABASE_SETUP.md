# Unified Lead Engine — Supabase setup

Project: **smqwemfobrqxnpcooigd** (`https://smqwemfobrqxnpcooigd.supabase.co`)

## 1. Apply migration

Run in **Dashboard → SQL Editor** (in order):

1. `supabase/migrations/20250612120000_unified_lead_engine.sql`
2. `supabase/migrations/20250613120000_lead_calculator_email_fields.sql`
3. `supabase/migrations/20250613140000_abandon_funnel_index.sql`

## 2. Deploy Edge Functions

**Important:** Deploy from **`salesMastery/supabase`**, not `SeamlesslyVendorUI/seamlesslyUs/supabase`.
The frontend repo only contains `track-calculator-event`; unified lead functions live here.

From `salesMastery/supabase`:

```bash
./deploy-lead-engine-functions.sh
```

Or deploy individually:

```bash
cd salesMastery/supabase
supabase functions deploy ingest-lead-event --no-verify-jwt
supabase functions deploy score-lead
supabase functions deploy on-lead-submit --no-verify-jwt
supabase functions deploy send-followup-emails
supabase functions deploy send-calculator-abandon-emails
```

Required secrets (project settings → Edge Functions):

- `BREVO_API_KEY`
- `SUPABASE_URL` (injected automatically in hosted runtime)
- `SUPABASE_SERVICE_ROLE_KEY` (injected automatically in hosted runtime)

## 3. Database Webhook (manual — one step)

Supabase CLI does **not** version-control Database Webhooks in `config.toml` as of this setup. Register in Dashboard:

1. **Database → Webhooks → Create a new hook**
2. **Table:** `public.scan_and_scale_click_events`
3. **Events:** `INSERT`
4. **Filter:** `engine_version = 'v2'`
5. **Type:** Supabase Edge Function
6. **Function:** `on-lead-submit`
7. **HTTP method:** `POST`
8. **Timeout:** 5000ms (or higher if Brevo is slow)

The frontend also POSTs to `on-lead-submit` after lead capture. Idempotency flags (`notification_sent`, `emails_sent`, `call_task_created`) prevent duplicate owner emails and sequence sends when both fire.

**Important:** If an existing Database Webhook still points **all** `INSERT` events on `scan_and_scale_click_events` to `on-new-click-event`, either **delete** that hook or change its filter to `engine_version = 'v1'` only. Otherwise v2 leads will receive duplicate automation from both handlers.

## 4. Cron — `send-followup-emails`

**Dashboard → Edge Functions → `send-followup-emails` → Schedules**

| Field | Value |
|-------|--------|
| Cron | `0 8 * * *` (daily 08:00 UTC) |
| Method | `POST` |

The unified `send-followup-emails` processes:

- `engine_version = 'v1'` — legacy in-flight leads (templates 138–140)
- `engine_version = 'v2'` — new unified engine leads (templates 138–140)

Does **not** process `engine_version = 'v2_abandon'`.

## 4b. Cron — `send-calculator-abandon-emails` (templates 195–198)

**Dashboard → Edge Functions → `send-calculator-abandon-emails` → Schedules**

| Field | Value |
|-------|--------|
| Cron | `30 8 * * *` (daily 08:30 UTC) |
| Method | `POST` |

Each run enrolls eligible `calculator_page_visits` (email on file, 2h+ since visit, no lead funnel) into `scan_and_scale_click_events` with `engine_version = 'v2_abandon'`, then sends templates **195 → 196 → 197 → 198** on day 0 / 2 / 4 / 6.

Funnel stages: `abandon_enrolled` → `abandon_email_1_sent` … → `abandon_completed`. If the contact later submits via `submitUnifiedLead`, the row moves to `engine_version = 'v2'` and `funnel_stage = 'abandon_exited'`.

**Do not remove** the separate `send-calculator-followup-emails` cron while calculator-page visits (templates 149–152) are still draining.

## 5. Frontend env (seamlesslyUs / Vercel)

- `VITE_SUPABASE_URL_SALES_MASTERY` or `REACT_APP_SUPABASE_URL_SALES_MASTERY`
- `VITE_SUPABASE_ANON_KEY_SALES_MASTERY` or `REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY`

Optional for API proxy (`api/ingest-lead-event.js`):

- `SUPABASE_SERVICE_ROLE_KEY` or anon key (anon is sufficient if `ingest-lead-event` stays `verify_jwt = false`)

## 6. Smoke test (v2 lead)

1. Open `https://www.seamlessly.us/calculator/sports`
2. Complete calculator + lead modal (name, email, phone)
3. Verify in Supabase:
   - `scan_and_scale_click_events`: `engine_version = 'v2'`, `intent_score` / `intent_tier` set
   - `lead_events`: rows for `calculator_viewed`, `lead_submitted`, etc.
   - `follow_up_tasks`: one row if phone present
4. Confirm **one** owner notification, **one** Brevo Email 1 (template **137**), and guide (template **194**) to prospect
5. Confirm `calculator_page_visits.emails_sent` stays **0** for that submit (no template **149**)

## 7. Disable legacy `calculator_page_visits` webhook (required)

**Dashboard → Database → Webhooks** — delete or disable the hook that calls `on-calculator-form-submit` on `calculator_page_visits` **UPDATE** (or INSERT).

Then redeploy the guarded handler:

```bash
cd salesMastery/eCommerceSite/scan-and-scale/calculator-page-funnel
supabase functions deploy on-calculator-form-submit --no-verify-jwt
```

`on-calculator-form-submit` now **no-ops** when:

- A `scan_and_scale_click_events` row exists with `engine_version = 'v2'` for the same email, or
- `LEGACY_CALCULATOR_AUTOMATION_ENABLED` is not set to `true` (default: disabled)

Frontend `submitUnifiedLead` writes identity + attribution together on `calculator_page_visits` after the v2 lead row exists (legacy webhook no-ops for v2).

## 8. Legacy drain (cron only — templates 150–152)

| Component | Status |
|-----------|--------|
| `on-calculator-form-submit` | **Disabled by default** — do not re-enable for new traffic |
| `send-calculator-followup-emails` | Keep cron until no `calculator_page_visits` rows have `emails_sent` between 1 and 3 |
| `on-new-click-event` | v1 `scan_and_scale_click_events` only — filter webhook to `engine_version = 'v1'` |

Archive templates **149–152** after the drain query returns zero in-flight rows.
