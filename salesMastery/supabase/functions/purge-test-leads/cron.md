# purge-test-leads — cron schedule

Schedule this Edge Function to run **daily at 03:00 UTC**.

## Cron expression

```
0 3 * * *
```

## Supabase Dashboard

1. Deploy `purge-test-leads` (see `deploy-lead-engine-functions.sh`).
2. In **Database** → **Extensions**, ensure `pg_cron` and `pg_net` are enabled.
3. Register the schedule (replace `<SUPABASE_SERVICE_ROLE_KEY>`):

```sql
select cron.schedule(
  'purge-test-leads',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://smqwemfobrqxnpcooigd.supabase.co/functions/v1/purge-test-leads',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Behavior

- Deletes test-pattern leads from all funnel tables **older than 7 days**.
- Patterns: `%test%`, `%seamlessly%`, `%user%`, exact `maurice@mauricethefirst.com`, plus name `%test%` / `%user%` on canonical leads.
- Deletes in cascade order: `follow_up_tasks` → `lead_events` (by `lead_id` + email) → visit/engagement/journey tables → `scan_and_scale_click_events`.
