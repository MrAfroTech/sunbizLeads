# daily-org-funnel-snapshot — cron schedule

Schedule this Edge Function to run **daily at 08:00 UTC**.

## Cron expression

```
0 8 * * *
```

## Supabase Dashboard (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/smqwemfobrqxnpcooigd/functions) → **Edge Functions** → `daily-org-funnel-snapshot`.
2. After deploying the function, go to **Database** → **Extensions** and ensure `pg_cron` is enabled (if using SQL scheduling).
3. Or use **Integrations** → **Cron** / **Scheduled Functions** (UI varies by Supabase version) to invoke the function on the schedule above.

## pg_cron via SQL (alternative)

After the function is deployed, you can register a daily HTTP invoke with `pg_cron` + `pg_net` (replace placeholders with your project ref and service role key):

```sql
select cron.schedule(
  'daily-org-funnel-snapshot',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://smqwemfobrqxnpcooigd.supabase.co/functions/v1/daily-org-funnel-snapshot',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Notes

- Cron registration is **not** implemented in application code; configure it manually in Supabase.
- The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (injected automatically in the Edge Function runtime).
- Run `sql/org_funnel_snapshots.sql` in the SQL editor before the first scheduled run.
