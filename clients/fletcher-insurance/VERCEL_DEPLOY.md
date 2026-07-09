# Deploy notes (Vercel)

## Serverless webhook

- Root directory = repo folder containing **`vercel.json`**.
- **`api/webhooks/typeform.js`** handles **`POST /api/webhooks/typeform`**; **`vercel.json`** rewrites **`/webhooks/typeform`** → that function so Typeform can use the clean URL.
- **`api/index.js`** re-exports **`apps/api/src/index.js`** for Express (local dev / fallback).
- Configure Typeform to: **`https://fletcher-insurance.vercel.app/webhooks/typeform`** (also works: **`https://fletcher-insurance.vercel.app/api/webhooks/typeform`**)
- Set **`TYPEFORM_WEBHOOK_SECRET`**, **`SUPABASE_*`**, **`BREVO_*`**, **`SALES_ALERT_EMAIL`** in Vercel project env.

## Frontend

- Build outputs **`apps/web/dist`** (see **`vercel.json`**).
- Set **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`** in the Vercel project (same names as **`apps/api/.env`**). The Vite build maps them into the client bundle; do **not** expose **`SUPABASE_SERVICE_ROLE_KEY`** to the frontend env.
- No separate `apps/web/.env` — env is centralized under **`apps/api/.env`** locally; in Vercel, mirror those variable names.

## Raw body

The webhook route uses **`express.raw()`** so **`Typeform-Signature`** HMAC matches the raw JSON body.
