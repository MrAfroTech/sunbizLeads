# Placeholders Reference (New Client White Lable System)

Use this list when onboarding a new client. Only **client** identity, database, and copy/assets are placeholders. Stripe and Klaviyo are **service-level** (EventBrella’s)—not templated.

## Service-level (not templated)

- **Stripe** – Tied to the service we provide. Same Stripe account/keys across clients. Set in deployment env; do not add Stripe vars to this template or per-client checklist.
- **Klaviyo** – Tied to the service we provide. Same Klaviyo account/API key across clients. Set in deployment env; do not add Klaviyo vars to this template or per-client checklist.

## Config & environment (client-specific placeholders only)

| Placeholder | Where | Action per client |
|-------------|--------|-------------------|
| `CLIENT_NAME` | `config.json` → `clientName` | Set to client business name. |
| `CLIENT_APP_NAME` | `config/config.env` → `APP_NAME` | Set to app/product name. |
| `CLIENT_ORGANIZER_NAME` | `config/config.env` → `ORGANIZER_NAME` | Set in Vercel env. Used in API metadata, emails, scan UI. |
| `CLIENT_SUBDOMAIN` | `config/config.env` → `BASE_URL`; `config.json` → `homeUrl` | e.g. `clientname` in `https://clientname.eventbrella.us`. Set `BASE_URL` in Vercel. |
| `postgresql://user:password@host:port/database` | `config/config.env` → `DATABASE_URL` | Client’s PostgreSQL connection string; set in Vercel. |
| `CLIENT_TICKETS_TABLE` / `CLIENT_EVENTS_TABLE` | `config/config.env` | Only if using DynamoDB; otherwise leave as placeholder. |

## Code (env-driven; no hardcoded client names)

- **`ORGANIZER_NAME`** – Used in API and emails. Set in Vercel per client.
- **`BASE_URL`** – Used in payment and webhook. Set in Vercel per client.
- **`CLIENT_SOURCE_ID`** – Optional; default: `eventbrella_ticketing`.

## Vercel

- **`.vercel`** – In `.gitignore`. Do not commit. Each new client = new Vercel project.
- **Host-specific rewrites** – Add client subdomain in Vercel if needed; no client hostname in template `vercel.json`.

## Copy and assets (white-label placeholders)

All client-specific copy is a **placeholder** (no Farmer Banks, Here On The Farm, etc. in the repo). Use **WHITE_LABEL_PLACEHOLDERS.md** for the full list.

- **Identity/venue/contact** – `CLIENT_ORGANIZER_NAME`, `CLIENT_VENUE_NAME`, `CLIENT_WEBSITE_URL`, `CLIENT_ADDRESS_LINE1`, `CLIENT_ADDRESS_LINE2`, `CLIENT_PHONE`, `CLIENT_CONTACT_EMAIL`, `CLIENT_ORGANIZER_IMAGE_URL`.
- **Copy** – `CLIENT_VENUE_DESCRIPTION`, `CLIENT_ABOUT_PARAGRAPH_1`, `CLIENT_FARM_TOURS_DESCRIPTION`, `CLIENT_HARVEST_DESCRIPTION`, `CLIENT_MONTHLY_EVENT_DESCRIPTION`, etc. (see WHITE_LABEL_PLACEHOLDERS.md).
- **Images** – `CLIENT_HERO_IMAGE_LEFT.png`, `CLIENT_HERO_IMAGE_RIGHT.png`, `CLIENT_EVENT_POSTER_IMAGE_URL`. Add client assets to `public/images/` and point placeholders to the correct paths/URLs.
- **Maps** – `CLIENT_GOOGLE_MAPS_EMBED_URL`, `CLIENT_GOOGLE_MAPS_DESTINATION`.
