# MagicBands click-event funnel

Same stack and automation as Scan & Scale (`public.scan_and_scale_click_events`): owner alert, Email 1 (with runtime CTA strip), optional call task, and scheduled Emails 2–4 via Brevo templates. **Copy surfaces only** are pivoted to MagicBands — wristband-based guest flow for hospitality venues, touring events, and live experiences.

## Layout

| Path | Purpose |
|------|---------|
| `migrations/` | SQL to add funnel columns + `follow_up_tasks` |
| `config/settings.json` | Owner notification address, funnel name, sequence day offsets |
| `config/brevo-templates.json` | Numeric Brevo template IDs (fill via script) |
| `scripts/create-brevo-templates.mjs` | POSTs four HTML files to Brevo; writes `brevo-templates.json` |
| `functions/` | Edge Function implementations (shared helpers under `functions/_shared`) |
| `supabase/functions/` | Deploy entrypoints each function subfolder consumes `functions/*.ts` |
| `supabase/config.toml` | Local deploy hints (`verify_jwt`, `project_id` placeholder) |

## Environment variables

All secrets come from Edge Function secrets / env — never checked into git.

**Required:**

| Variable | Used by |
|----------|---------|
| `BREVO_API_KEY` | Brevo REST (`/senders`, `/smtp/templates/{id}`, `/smtp/email`) |
| `SUPABASE_URL` | Supabase JS admin client (`createClient`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role updates to `scan_and_scale_click_events` + `follow_up_tasks` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically for Supabase-hosted Edge Functions after you confirm they appear under **Edge Functions → Secrets** in the Dashboard. If missing, add them explicitly with:

```bash
cd eCommerceSite/scan-and-scale/funnels/magicBands
supabase secrets set BREVO_API_KEY="<key>"
# only if Dashboard does not already provide them:
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<srk>" SUPABASE_URL="https://<ref>.supabase.co"
```

## 1 — Database migration

1. Copy `migrations/20250515130000_scan_scale_funnel_columns_and_follow_up_tasks.sql` into your Supabase project’s migration runner (CLI `supabase/migrations` locally, SQL editor remotely, etc.).
2. Apply it (`supabase db push`, `migration up`, or paste in SQL Editor). This adds funnel columns plus `follow_up_tasks` with RLS enabled (no public policies — only the service-role client bypasses).

## 2 — Create Brevo templates

Templates read from `salesMastery/emailSequences/magicBandsSequence/magic_bands_email_*.html` by default. Override path with:

```bash
export SCAN_SCALE_EMAIL_TEMPLATE_DIR="/absolute/path/to/dir"
```

Run (Node ≥ 18):

```bash
cd eCommerceSite/scan-and-scale/funnels/magicBands
export BREVO_API_KEY="…"
node scripts/create-brevo-templates.mjs
```

Each template POSTs via `POST /v3/smtp/templates` (`isActive: true`, subject + HTML from disk, verified account sender sourced from `GET /v3/senders`). The script refreshes `config/brevo-templates.json` with the returned IDs.

Deploy Edge Functions afterward so bundles pick up updated JSON imports.

## 3 — Deploy Edge Functions

Working directory must be **`funnels/magicBands`** so the CLI resolves `funnels/magicBands/supabase/`.

```bash
cd eCommerceSite/scan-and-scale/funnels/magicBands
supabase link --project-ref <your-ref>   # first time only
supabase functions deploy on-new-click-event --no-verify-jwt
supabase functions deploy send-followup-emails --no-verify-jwt
```

`supabase/config.toml` sets `[functions.<name>] verify_jwt = false` placeholders; if your CLI rejects `--no-verify-jwt`, disable JWT verification in Dashboard → Functions instead (required for Database Webhooks + Cron).

Secrets set in step “Environment variables” must exist before invokes succeed.

### Webhook (`on-new-click-event`)

Configure **Database → Webhooks** (or Automation) so `INSERT` on `public.scan_and_scale_click_events` POSTs JSON to:

`https://<project-ref>.supabase.co/functions/v1/on-new-click-event`

Recommended settings:

- **HTTP method**: POST  
- **Headers**: `Content-Type: application/json` (+ whatever Supabase’s wizard adds)  
- **Payload**: Include the new row so the function parses `payload.record` (official Supabase payload includes `"type":"INSERT"` and `"table":"scan_and_scale_click_events"`).  
- JWT verification stays **disabled** unless you intentionally forward a Bearer token compatible with JWT enforcement.

Manual smoke test:

```bash
curl -X POST "$FN_URL/on-new-click-event" \
  -H "Authorization: Bearer $SERVICE_ROLE_OR_ANON_OR_CUSTOM" \
  -H 'Content-Type: application/json' \
  -d '{"record":{"id":"<uuid>","email":"you@domain.com"}}'
```

Provide the freshly inserted row’s fields for realistic behavior.

Behavior order:

1. **Step A**: Transactional notification to owner (`settings.json`) listing lead fields plus prominent phone banner + CALL TASK CREATED note only when phone present; marks `notification_sent`.  
2. **Step B**: Fetch Email 1 template HTML from Brevo, removes only the BOOK YOUR FREE… CTA anchor, sends transactional email; sets `emails_sent = 1`, `funnel_stage = email_1_sent`.  
3. **Step D**: If `phone` non-empty insert `follow_up_tasks` (`task_type` `call`), then `call_task_created = true`.

Retries short-circuit by re-reading rows so duplicates are minimized.

### Scheduler (`send-followup-emails`)

Runs daily (cron) to advance `emails_sent` / `funnel_stage`:

| Existing `emails_sent` | Requires `created_at` at least … old | Sends | Next stage |
|---|---|---|---|
| `1` | **2 days** | Template `email_2_template_id` | `email_2_sent` (`emails_sent = 2`) |
| `2` | **4 days** | Template `email_3_template_id` | `email_3_sent` (`emails_sent = 3`) |
| `3` | **6 days** | Template `email_4_template_id` | `email_4_sent` (`emails_sent = 4`) |

Cron setup (pick one):

- **Dashboard**: Edge Functions → `send-followup-emails` → schedule every 24h (UTC-friendly window).  
- **pg\_cron**: schedule `POST` to `$SUPABASE_FUNCTIONS_URL/send-followup-emails` using `cron.schedule` docs in Supabase.  
- **`supabase/functions` cron config** snippets change quickly—follow Dashboard guidance for your platform version after deploy.

Smoke test manually:

```bash
curl "$FN_URL/send-followup-emails" -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE" 
```

Responses include `{ "sent": { "2": n, ... } }` counts.

## Operational notes

- **Template IDs drift**: Updating `config/brevo-templates.json` requires redeploying both functions (`supabase functions deploy …`) so bundles include the newer JSON snapshots.  
- **Email 1 CTA tweak** happens only inside the Edge runtime string replace; canonical HTML assets stay untouched elsewhere.  
- **Idempotency**: Webhook retries advance only when flags / counters still allow missing work; sequential updates use optimistic `WHERE emails_sent = n` clauses for follow-ups.  
- **RLS**: `follow_up_tasks` denies PostgREST access for anon/authenticated; service-role Edge calls perform writes.

## Troubleshooting checklist

| Symptom | Check |
|---------|-------|
| 401 Unauthorized | JWT verification toggle + Authorization header forwarded by webhook/cron |
| Missing template HTML | Fetch template in Brevo UI; IDs in `config/brevo-templates.json`; redeploy after script |
| Duplicate emails | Webhook concurrency; verify flags before external sends |

That’s everything required to operationalize `/scan-scale-funnel` alongside your existing storefront.
