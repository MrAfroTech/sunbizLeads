# EventBrella New Client White Lable System

**Client-agnostic baseline.** This white lable system is used to spin up new ticketing clients. No client-specific values are committed; all such inputs are placeholders or environment variables.

---

## Purpose

- **Stripe & Klaviyo** – Tied to the **service we provide** (EventBrella). Same Stripe and Klaviyo accounts/keys across clients; **not** templated or per-client.
- **Vercel** – Each new client is a **new Vercel project**; this repo does not include a `.vercel` directory so every deployment links to a fresh project.
- **Placeholders** – Only **client** identity, database, and copy/assets are placeholders (e.g. `CLIENT_NAME`, `ORGANIZER_NAME`, `BASE_URL`). Stripe and Klaviyo variables are not templated.

---

## What This System Includes

| Area | Description |
|------|-------------|
| **Payments** | Stripe Checkout; webhook for `checkout.session.completed`. **Service-level:** EventBrella’s Stripe (keys set in deployment env, not per client). |
| **Database** | PostgreSQL (e.g. Vercel Postgres, Supabase). Schema in `supabase-setup.sql`. **Per client:** `DATABASE_URL`. |
| **Email / CRM** | Klaviyo “Ticket Purchased” events and flows. **Service-level:** EventBrella’s Klaviyo (API key etc. set in deployment env, not per client). |
| **Frontend** | Static pages: event listing, event detail, payment, success, scan-tickets. Copy and assets are placeholders; replace per client. |
| **API** | Serverless functions under `api/`: `stripe-payment`, `stripe-webhook`, `events`, `validate-ticket`, `checkin-report`, etc. |

---

## Key Files (Client-Agnostic)

- `config/config.env` – **Template only.** All values are placeholders; never commit real secrets. Copy to `.env` or set in Vercel per client.
- `config.json` – Client app name and URLs; use placeholders until onboarding.
- `vercel.json` – Routes and function config. No client hostnames; add client subdomain in Vercel when onboarding.
- `supabase-setup.sql` – Generic `tickets` (and related) schema; no client-specific table names.

---

## What Is Service-Level vs Client-Specific

**Service-level (EventBrella; not templated):**
- **Stripe** – Our Stripe account/keys. Set in deployment env; same across clients.
- **Klaviyo** – Our Klaviyo account/API key (and list IDs if used). Set in deployment env; same across clients.

**Client-specific (placeholders / per client):**
- **Base URL / domain:** `BASE_URL`; subdomain in `vercel.json` when needed.
- **Organizer / brand:** `ORGANIZER_NAME`, `APP_NAME`; used in metadata and copy.
- **Database:** `DATABASE_URL` (one DB per client or per environment).
- **Copy, images, event names** in `public/**`, `platformDrivenPages/**`; replace during onboarding.

See **SOP_ONBOARDING_NEW_TICKETING_CLIENT.md** for the step-by-step checklist of client-specific inputs.

---

## Local Use (No Real Client Data)

1. Clone or copy this codebase (do not use a repo that already has `.vercel` linked to a client).
2. `npm install`
3. Do **not** run against production Stripe/DB/Klaviyo. Use `TEST_MODE=true` and placeholder env if you run anything.
4. For a **new client**, follow the SOP: gather client-specific inputs, create new Vercel project, set env, then deploy.

---

## Deploying a New Client (Summary)

1. Copy this codebase to a new repo or branch for the client.
2. **Do not** commit or reuse a `.vercel` directory – each client = new Vercel project.
3. In Vercel: New Project → Import this repo → set **client** env vars (identity, `DATABASE_URL`). Stripe and Klaviyo are already service-level (set once for the service).
4. Replace placeholders in `config.json`, client identity in env, and in `public/**` copy/assets.
5. Run `supabase-setup.sql` (or equivalent) in the client’s database.
6. Add this deployment’s URL to Stripe webhooks if needed (same Stripe account; new endpoint URL per deployment).
7. Deploy and test checkout, webhook, and scan flow.

Full checklist: **SOP_ONBOARDING_NEW_TICKETING_CLIENT.md**.
