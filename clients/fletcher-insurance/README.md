## Fletcher Insurance

### Flow

1. **Typeform** sends a webhook `POST` to **`https://fletcher-insurance.vercel.app/webhooks/typeform`** (Vercel rewrites that path to **`api/webhooks/typeform.js`** so the raw body matches the HMAC signature; **`/api/webhooks/typeform`** still works too). Locally: `npm run dev` in `apps/api` → **`http://localhost:8787/webhooks/typeform`**.
2. The handler verifies the signature, upserts **`public.leads`**, then updates the **same row** with tier, budget, timeline, **`lead_score`**, **`lead_category`**, **`raw_typeform`**, **`typeform_token`**, **`form_submitted_at`**, and sends **one** Brevo email to **`SALES_ALERT_EMAIL`** when **`urgencyTier === TIER_1_HIGH`** OR **`lead_category`** is **Hot** or **Warm**.
3. The **React app** reads **`public.leads`** only (Supabase **anon** key).

### Repo layout

- `api/`: Vercel entry → `apps/api/src/index.js` (webhook only)
- `apps/api`: Express handler + Supabase (service role) + Brevo
- `apps/web`: Vite + React dashboard (Supabase client)
- `packages/shared`: scoring helpers
- `supabase`: SQL schema + migrations

### Environment

**Single file: `apps/api/.env`** — shared by the Typeform webhook and the Vite dashboard. See `apps/api/.env.example`.

- **API / webhook:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TYPEFORM_WEBHOOK_SECRET`, `BREVO_*`, `SALES_ALERT_EMAIL`
- **Dashboard (browser):** `SUPABASE_URL` + **`SUPABASE_ANON_KEY`** (publishable key). Vite reads from this same file via `apps/web/vite.config.js` and injects them at build time as `VITE_*` for the client (never put the service role in the web bundle).

### Supabase

1. Run `supabase/schema.sql` (and any migrations you need) in the SQL editor.

**RLS disabled (your setup):** You do **not** need the anon RLS policy migrations (`20250318120000_*`, `20250318160000_*`). Those only matter when row-level security is **on**.

- **Webhook:** uses **`SUPABASE_SERVICE_ROLE_KEY`** — full access regardless of RLS.
- **Dashboard (browser):** uses **`SUPABASE_ANON_KEY`** — with RLS off, run **`supabase/grants_anon_dashboard_rls_off.sql`** if `anon` cannot `SELECT` **`public.leads`**.

**RLS enabled:** Add policies so **`anon`** can `SELECT` **`public.leads`** (and `INSERT` only if you use browser intake).

### Run locally

```bash
cd apps/api && npm install && npm run dev
```

```bash
cd apps/web && npm install && npm run dev
```

**Webhook URL (local):** `http://localhost:8787/webhooks/typeform` or `http://localhost:8787/api/webhooks/typeform`

**Webhook URL (Vercel):** `https://fletcher-insurance.vercel.app/webhooks/typeform` (alternate: `https://fletcher-insurance.vercel.app/api/webhooks/typeform`)

Configure Typeform with **`TYPEFORM_WEBHOOK_SECRET`** and header **`Typeform-Signature`**.

### Troubleshooting

**Missing columns on `leads`**

Run **`supabase/migrations/20250318190000_typeform_columns_on_leads.sql`** (or full **`schema.sql`**) so `leads` has `urgency_tier`, `lead_score`, `form_submitted_at`, etc. See **`supabase/README_TABLES.md`**.
