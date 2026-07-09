# enrich-lead — Explorium enrichment pipeline

Processes `lead_enrichment_queue` rows and writes to `enriched_contacts`.
May auto-assign `account_cluster_poc` when seniority + cluster_size qualify.

## Required secrets

| Variable | Description |
|----------|-------------|
| `EXPLORIUM_API_KEY` | Explorium API key (header `API_KEY`). Rotate via `supabase secrets set EXPLORIUM_API_KEY=... --project-ref smqwemfobrqxnpcooigd` — edge functions read secrets at invoke time; **no redeploy required** after rotation. |
| `EXPLORIUM_API_BASE_URL` | Default `https://api.explorium.ai` |
| `ENRICHMENT_PRIORITY_THRESHOLD` | Min `priority_score` to enrich when `cluster_size < 3` (live: `3`) |
| `ENRICHMENT_DAILY_CREDIT_CAP` | Daily Explorium credit cap (live: `100`; match + profile = 2 credits/lead) |

## Invoke

```bash
# Single lead
curl -X POST "$SUPABASE_URL/functions/v1/enrich-lead" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"llamar@athletics.ucla.edu"}'

# Process pending queue (batch of 10)
curl -X POST "$SUPABASE_URL/functions/v1/enrich-lead" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"process_queue":true}'
```

## Scheduling

**Live:** `enrich-lead-queue` runs every **15 minutes** via `pg_cron` + `pg_net`:

```
*/15 * * * *
→ POST /functions/v1/enrich-lead {"process_queue":true}
```

Verify:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'enrich-lead-queue';
```

To reschedule (replace service role key):

```sql
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'enrich-lead-queue';

SELECT cron.schedule(
  'enrich-lead-queue',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://smqwemfobrqxnpcooigd.supabase.co/functions/v1/enrich-lead',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{"process_queue":true}'::jsonb
  );
  $$
);
```

## Tech debt

- **Rate limiting:** Explorium enforces per-minute query limits; batch size is capped at 10.
- **Cost cap:** `ENRICHMENT_DAILY_CREDIT_CAP` is optional; set in production to prevent runaway spend.
- **Trigger scope:** Queue fires on `finished_calc_leads`, `calculator_page_visits`, `scan_and_scale_click_events` inserts — not on the view itself (Postgres cannot trigger on views).

## POC precedence

1. `account_cluster_poc` (Explorium auto-assigned senior contact)
2. `account_poc_overrides` (static seed / manual fallback)
