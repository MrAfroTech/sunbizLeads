# Lead Priority View — Acceptance Tests

Run after any deploy that touches `v_lead_priority` or its source tables.

## Test 1 — Standing email (UCLA newsletter landing)

```sql
SELECT email, full_name, furthest_stage, furthest_stage_label, calculator_type, last_activity
FROM v_lead_priority
WHERE email = 'llamar@athletics.ucla.edu';
```

**Expected:** one row; `full_name = 'Lori Lamar'`; `furthest_stage = 1` (Newsletter Engaged); `calculator_type = 'sports2_calculator'`.

## Test 2 — Generic class (no CPV-only gaps)

Every non-excluded email in `calculator_page_visits` must appear in `v_lead_priority`.

```sql
WITH cpv_emails AS (
  SELECT DISTINCT lower(trim(email)) AS email
  FROM calculator_page_visits
  WHERE email IS NOT NULL AND trim(email) <> ''
    AND email NOT ILIKE '%test%'
    AND email NOT ILIKE '%seamlessly%'
    AND email NOT ILIKE '%user%'
    AND lower(trim(email)) <> 'maurice@mauricethefirst.com'
)
SELECT COUNT(*) AS cpv_only_not_in_view
FROM cpv_emails c
WHERE NOT EXISTS (SELECT 1 FROM v_lead_priority v WHERE v.email = c.email);
```

**Expected:** `cpv_only_not_in_view = 0`

## Test 3 — UCLA domain gap (domain-specific sanity)

```sql
WITH cpv_emails AS (
  SELECT DISTINCT lower(trim(email)) AS email
  FROM calculator_page_visits
  WHERE email IS NOT NULL AND trim(email) <> ''
    AND split_part(lower(trim(email)), '@', 2) = 'athletics.ucla.edu'
    AND email NOT ILIKE '%test%'
    AND email NOT ILIKE '%seamlessly%'
    AND email NOT ILIKE '%user%'
    AND lower(trim(email)) <> 'maurice@mauricethefirst.com'
)
SELECT COUNT(*) AS ucla_cpv_only_not_in_view
FROM cpv_emails c
WHERE NOT EXISTS (SELECT 1 FROM v_lead_priority v WHERE v.email = c.email);
```

**Expected:** `ucla_cpv_only_not_in_view = 0`

## Test 4 — UCLA cluster POC routing

```sql
SELECT email, full_name, cluster_size, cluster_poc_email, suppress_individual_outreach
FROM v_lead_priority
WHERE domain = 'athletics.ucla.edu'
ORDER BY email;
```

**Expected:**
- `cluster_poc_email = 'kmaciel@athletics.ucla.edu'` on all UCLA rows where `cluster_size >= 3`
- `llamar@athletics.ucla.edu` has `suppress_individual_outreach = true`
- `kmaciel@athletics.ucla.edu` has `suppress_individual_outreach = false`

## Test 5 — Generic CPV coverage (class regression)

Same as Test 2 — must remain `0` after cluster/enrichment migrations.

## Test 6 — Leak 1: zero null-email `calculator_viewed` going forward

After deploying the frontend (`useLeadEventTracker` URL identity) + `ingest-lead-event`, open a calculator with Brevo merge tags (`?email=...&firstName=...`) and confirm a new `lead_events` row has email set.

Regression query (new events only — use a deploy watermark):

```sql
SELECT COUNT(*) AS null_email_viewed_since_fix
FROM lead_events
WHERE event_name = 'calculator_viewed'
  AND email IS NULL
  AND created_at > '2026-07-09 12:00:00+00';  -- set to deploy time
```

**Expected:** `0` for all new events after the fix.

Note: historical nulls without a reliable `meta.visit_id → calculator_page_visits` join are left alone (no guess-fill).

## Test 7 — Leak 2: junk-row rejection (unresolved merge tag)

```sql
-- Attempt would be blocked by trigger; verify quarantine log path:
SELECT public.email_quarantine_reason('{{ contact.EMAIL }}') AS reason;
```

**Expected:** `unresolved_merge_tag`

```sql
INSERT INTO calculator_page_visits (page_key, email)
VALUES ('sports_calculator', '{{ contact.EMAIL }}');
-- should insert 0 rows into CPV; 1 row into lead_ingestion_rejects
SELECT reason, email FROM lead_ingestion_rejects
WHERE reason = 'unresolved_merge_tag'
ORDER BY rejected_at DESC LIMIT 1;
```

**Expected:** reject logged with `reason = 'unresolved_merge_tag'`; no CPV row with that email.

## Test 8 — Leak 2: junk-row rejection (test domain)

```sql
SELECT public.email_quarantine_reason('foo@example.com') AS reason;
SELECT public.email_quarantine_reason('bar@team.us') AS reason2;
SELECT public.email_quarantine_reason('baz@team.com') AS reason3;
```

**Expected:** all return `test_domain`

```sql
SELECT COUNT(*) AS junk_in_view
FROM v_lead_priority
WHERE domain IN ('example.com', 'team.us', 'team.com')
   OR email LIKE '%{{%'
   OR email LIKE '%}}%';
```

**Expected:** `0`

## Test 9 — Leak 2: junk-row rejection (invalid email)

```sql
SELECT public.email_quarantine_reason('not-an-email') AS reason;
```

**Expected:** `invalid_email`

---

## Deploy checklist (UI ↔ schema sync)

1. Apply Supabase migrations (cluster + quarantine)
2. Deploy edge functions: `ingest-lead-event`, `enrich-lead`
3. Confirm cron `enrich-lead-queue` active
4. **Deploy RevOps:** `cd leadManagement/revops && npm run build && vercel --prod`
5. Smoke-check https://revops-zeta.vercel.app — Lead Priority tab shows Cluster POC, SUPPRESSED badge, CSV, status edit
6. Run Tests 1–9 above
