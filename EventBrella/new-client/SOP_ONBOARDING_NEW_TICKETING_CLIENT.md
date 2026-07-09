# SOP: Onboarding a New Ticketing Client

Standard Operating Procedure for spinning up a new client from the EventBrella New Client White Lable System. Use this checklist so no client-specific input is missed.

---

## Before You Start

- [ ] Repo is client-agnostic (no `.vercel` folder committed; no real Stripe/DB keys in repo).
- [ ] **Remove or do not commit `.vercel`** – Each iteration of this system is a new Vercel project; the codebase does not ship with a linked `.vercel` directory (it is in `.gitignore`).
- [ ] You have a copy of this codebase (new repo, branch, or directory) dedicated to this client.

---

## 1. Client Identity & Branding

| Input | Where It Goes | Example / Notes |
|-------|----------------|-----------------|
| **Client / business name** | `config.json` → `clientName`; `config.env` → `APP_NAME`; copy in `public/**` | e.g. "Acme Events" |
| **Organizer display name** | Env: `ORGANIZER_NAME`. Used in API metadata, emails, scan UI. | e.g. "Jane Smith" or "Acme Events" |
| **App / product name** | `config.json`; `config.env` → `APP_NAME` | e.g. "Acme Harvest Experience" |
| **Public base URL** | Env: `BASE_URL`. Vercel project URL or custom domain. | e.g. `https://acme.eventbrella.us` |
| **Custom domain (if any)** | Vercel Dashboard → Domains; optional rewrite in `vercel.json` by host | e.g. `tickets.clientdomain.com` |

**Placeholders to replace (find in repo):**  
All client-specific text is a **placeholder** (e.g. `CLIENT_ORGANIZER_NAME`, `CLIENT_VENUE_NAME`, `CLIENT_WEBSITE_URL`, `CLIENT_ADDRESS_LINE1`, `CLIENT_CONTACT_EMAIL`). Use **WHITE_LABEL_PLACEHOLDERS.md** for the full list and find-and-replace during onboarding.  
**Files:** `config.json`, `config/config.env`, all `public/**/*.html`, `platformDrivenPages/**/*.html`, `public/js/*.js`, and `allevents.html`.

---

## 2. Vercel Project

| Task | Details |
|------|---------|
| **New project** | Create a **new** Vercel project for this client. Do not reuse another client’s project. |
| **No .vercel in repo** | Ensure `.vercel` is in `.gitignore` and is not committed. Each deployment = new project link. |
| **Project name** | e.g. `client-name-ticketing` or `client-name-eventbrella`. |
| **Root directory** | Usually repo root (where `vercel.json` and `api/` live). |
| **Subdomain (optional)** | If using `clientname.eventbrella.us`, add domain in Vercel and, if needed, a host-based rewrite in `vercel.json`. |

---

## 3. Stripe (Payments) — Service-Level

Stripe is **tied to the service we provide** (EventBrella). Same Stripe account/keys across clients; **not** client-specific or templated.

| Task | Notes |
|------|--------|
| **Stripe keys** | Already configured at service level (EventBrella’s Stripe). No per-client Stripe keys. |
| **Webhook URL** | For each new deployment, add an endpoint in **our** Stripe Dashboard: `https://<this-client-vercel-url>/api/stripe-webhook` (so our Stripe receives events from this client’s site). |
| **Webhook secret** | If you use a different signing secret per endpoint, add it to this project’s Vercel env; otherwise the same service-level webhook secret may apply. |

**Checklist:**

- [ ] Service-level Stripe keys already in use (no client Stripe account).
- [ ] Webhook endpoint added in Stripe for this deployment’s URL (if not already covered).
- [ ] Checkout and webhook tested for this client’s deployment.

---

## 4. Database (PostgreSQL)

| Input | Where It Goes | Notes |
|-------|----------------|--------|
| **Connection string** | Vercel env: `DATABASE_URL` | Format: `postgresql://user:password@host:port/database` |
| **Database provider** | N/A | e.g. Vercel Postgres, Supabase, Neon, Railway. One DB per client (or per env). |

**Checklist:**

- [ ] New database created for this client (or dedicated schema).
- [ ] `supabase-setup.sql` (or equivalent) run to create `tickets` (and any other) tables.
- [ ] `DATABASE_URL` added to Vercel; no client DB credentials in repo.

---

## 5. Klaviyo (Email / Marketing) — Service-Level

Klaviyo is **tied to the service we provide** (EventBrella). Same Klaviyo account/API key across clients; **not** client-specific or templated.

| Task | Notes |
|------|--------|
| **Klaviyo API key / list IDs** | Already configured at service level (EventBrella’s Klaviyo). No per-client Klaviyo keys in template or env. |
| **From name / From email** | In Klaviyo flows/templates, use client branding (e.g. “Acme Events”, `noreply@…`) where needed; the integration itself uses our Klaviyo. |

**Checklist:**

- [ ] Service-level Klaviyo already in use (no client Klaviyo account).
- [ ] “Ticket Purchased” flow (or equivalent) uses client-facing from name/email where appropriate.
- [ ] Test purchase triggers Klaviyo event and email as expected.

---

## 6. Optional / Other Env

| Variable | Purpose |
|----------|---------|
| `TEST_MODE` | `true` = use test Stripe keys; `false` or unset when using live keys. |
| `EMAIL_FROM` | Sender address for transactional email (if used outside Klaviyo). |
| `EMAIL_SERVICE_API_KEY` | If using a separate email provider. |
| Tier/capacity env vars | e.g. `TIER_1_PRICE`, `EVENT_CAPACITY` – if the app reads them; set per client if needed. |

---

## 7. Copy, Assets, and Event Data (White-Label Placeholders)

The template uses **literal placeholders** (e.g. `CLIENT_ORGANIZER_NAME`, `CLIENT_VENUE_NAME`, `CLIENT_WEBSITE_URL`, `CLIENT_ADDRESS_LINE1`, `CLIENT_CONTACT_EMAIL`, `CLIENT_HERO_IMAGE_LEFT.png`). No client names (e.g. Farmer Banks, Here On The Farm) remain in the codebase.

| Item | Action |
|------|--------|
| **Full placeholder list** | See **WHITE_LABEL_PLACEHOLDERS.md** for every token and where it’s used. |
| **Find & replace** | Search for `CLIENT_` in the repo; replace each with the client’s value. |
| **Images** | Add client images to `public/images/`; set hero/organizer placeholders to correct paths or URLs. |
| **Maps** | Replace `CLIENT_GOOGLE_MAPS_EMBED_URL` and `CLIENT_GOOGLE_MAPS_DESTINATION` with client’s map URLs. |
| **Env (API)** | Set `ORGANIZER_NAME`, `CLIENT_VENUE_NAME`, `CLIENT_ADDRESS_LINE1`, `CLIENT_ADDRESS_LINE2` in Vercel if the API should use them. |

---

## 8. Post-Deploy Verification

- [ ] Homepage and event pages load; no placeholder client name visible.
- [ ] Checkout: create a test ticket (test Stripe); payment completes and redirects to success.
- [ ] Webhook: in Stripe Dashboard, confirm `checkout.session.completed` is received and returns 2xx.
- [ ] Ticket record created in DB (check `tickets` table).
- [ ] Klaviyo: “Ticket Purchased” (or equivalent) event received; test email looks correct.
- [ ] Scan page: validate a ticket by ID or QR; check-in works.

---

## Quick Reference: Env Vars

**Service-level (EventBrella; not per client):**  
Stripe and Klaviyo variables are set at the service level and are **not** templated. They are configured in deployment/env once for the service.

**Per client (set for each new client deployment):**
```
# Required — client data store
DATABASE_URL=postgresql://...

# Client identity
BASE_URL=https://<client-subdomain>.eventbrella.us
ORGANIZER_NAME=<Client Organizer Display Name>
APP_NAME=<Client App Name>

# Optional
TEST_MODE=true
```

Stripe and Klaviyo keys are not listed here; they are service-level and already configured.

---

## Document History

- **SOP created** – Baseline for EventBrella new client ticketing onboarding.
- **New Client White Lable System** – Client-agnostic; all client-specific input is placeholder or env-driven.
