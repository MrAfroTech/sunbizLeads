# Lead Priority Dashboard — Spec & Implementation

**Owner:** RevOps  
**Live view:** `v_lead_priority` (Postgres view, not materialized)  
**UI:** `leadManagement/revops` → **Lead Priority** tab

---

## Core columns

| Column | Source |
|--------|--------|
| `email` | Normalized lowercase union of all lead tables |
| `full_name` | `coalesce(finished_calc_leads.name, calculator_page_visits.name, enriched_contacts.full_name)` |
| `title` | `coalesce(enriched_contacts.job_title, finished_calc_leads.title)` |
| `company_name` | `coalesce(enriched_contacts.company_name, finished_calc_leads, SSCE)` |
| `linkedin_url` | `coalesce(enriched_contacts.linkedin_url, finished_calc_leads.linkedin_url)` |
| `furthest_stage` | Integer 1–7 (canonical funnel enum) |
| `priority_score` | `(furthest_stage × 10) + (event_count_30d × 2) + (contacts_at_domain × 5)` |
| `cluster_size` | Distinct emails at domain with activity in **trailing 30 days** |
| `cluster_poc_email` | Account POC for clustered domains (see routing below) |
| `suppress_individual_outreach` | `true` when clustered and email ≠ POC — AM logs account-level touch only |

---

## Account cluster routing (Part 1 — static POC seed)

**Table:** `account_poc_overrides`  
Manual enrichment completed 2026-07-09:

| Domain | POC | Title |
|--------|-----|-------|
| `columbiafireflies.com` | bshank@columbiafireflies.com (Brad Shank) | President |
| `athletics.ucla.edu` | kmaciel@athletics.ucla.edu (Karina Maciel) | Asst. Director Marketing & Fan Experiences |
| `whitecapsbaseball.com` | danm@whitecapsbaseball.com (Dan Morrison) | VP Sales |

When `cluster_size >= 3`, the view sets `cluster_poc_email` and suppresses non-POC contacts.

**POC precedence:**
1. `account_cluster_poc` — Explorium auto-assigned (Part 2, primary)
2. `account_poc_overrides` — static fallback when Explorium has not resolved POC

---

## Automated enrichment (Part 2 — Explorium)

**Edge function:** `enrich-lead`  
**Storage:** `enriched_contacts`  
**Queue:** `lead_enrichment_queue` (populated by triggers on source tables)

### Trigger path

Postgres cannot trigger on views. Queue fires on `INSERT`/`UPDATE` to:
- `finished_calc_leads`
- `calculator_page_visits`
- `scan_and_scale_click_events`

### Enrichment gate

Only calls Explorium when:
- No existing row in `enriched_contacts` for that email (no duplicate billed calls)
- `cluster_size >= 3` **OR** `priority_score >= ENRICHMENT_PRIORITY_THRESHOLD` (live: `3`)
- Under `ENRICHMENT_DAILY_CREDIT_CAP` if set (live: `100`)

### Explorium flow

1. `POST /v1/prospects/match` with email (+ name/company when available)
2. `POST /v1/prospects/profiles/enrich` with `prospect_id`
3. Write `enriched_contacts`: `lead_email`, `prospect_id`, `full_name`, `job_title`, `seniority_level`, `linkedin_url`, `company_name`, `enriched_at`
4. If `seniority_level` ∈ {c-suite, president, vp, director} AND `cluster_size >= 3` → upsert `account_cluster_poc`

### Environment variables

```
EXPLORIUM_API_KEY=
EXPLORIUM_API_BASE_URL=https://api.explorium.ai
ENRICHMENT_PRIORITY_THRESHOLD=3
ENRICHMENT_DAILY_CREDIT_CAP=100
```

### Tech debt

- Rate limiting / Explorium per-minute query caps (batch size capped at 10)
- Daily credit cap optional but recommended in production
- `lead_events.email IS NULL` on `calculator_viewed` — **separate ticket**; do not patch via view union only

---

## Acceptance tests

See `LEAD_PRIORITY_ACCEPTANCE_TESTS.md`.

**Standing tests:**
1. `llamar@athletics.ucla.edu` must appear after any view deploy
2. Every non-excluded `calculator_page_visits` email must appear in `v_lead_priority`
3. UCLA cluster: `cluster_poc_email = kmaciel@athletics.ucla.edu`; non-POC UCLA contacts have `suppress_individual_outreach = true`

---

## API layer (RevOps app)

Direct Supabase PostgREST (no separate API server):
- `GET` → `select * from v_lead_priority order by priority_score desc`
- `PATCH status` → upsert `follow_up_tasks` (`task_type = 'am_outreach'`)
- `GET CSV` → client export with their-number lookup

---

## Deploy checklist

Keep UI and Supabase schema in lockstep — never ship one without the other.

1. Apply migrations:
   - `20250709120000_lead_priority_cluster_enrichment.sql`
   - `20250709140000_lead_ingestion_rejects_and_quarantine.sql`
2. Deploy edge functions: `enrich-lead`, `ingest-lead-event`
3. Confirm secrets: `EXPLORIUM_API_KEY`, `EXPLORIUM_API_BASE_URL`, enrichment caps
4. Schedule `{"process_queue":true}` cron (see `enrich-lead/cron.md`)
5. Deploy calculator frontend (seamlesslyUs) if Leak 1 / CPV identity changed
6. **Deploy RevOps prod:** `cd leadManagement/revops && npm run build && vercel --prod`
7. Smoke-check https://revops-zeta.vercel.app — Lead Priority tab shows Cluster POC, SUPPRESSED badge, CSV export, live status edit
8. Run acceptance SQL tests in `LEAD_PRIORITY_ACCEPTANCE_TESTS.md` (Tests 1–9)
