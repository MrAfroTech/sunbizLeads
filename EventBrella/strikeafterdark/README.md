# Strike After Dark Ticketing

Digital ticketing for **Strike After Dark** at The Alley.

Strike After Dark digital ticketing (purchase → Stripe → webhook → QR → Supabase).

## Test mode

This project is configured with `TEST_MODE=true`.

- No live Stripe charges
- Checkout returns a mock session and redirects to `/success.html`
- Turnstile is skipped in test mode
- Ticket creation / Supabase path remains intact for live mode via `api/stripe-webhook.js` + `api/ticket-db.js`

## Customer flow

1. `/allevents.html` — event + tier selection (GA / Lane / VIP / VIP+Bottle / All-Access)
2. `/payment.html` — customer details → `POST /api/stripe-payment`
3. Stripe Checkout (live) or mock success (test)
4. `POST /api/stripe-webhook` creates tickets + QR and writes to Supabase
5. Confirmation email / `/success.html`

## Config

- `config/config.env` — `TEST_MODE`, pricing, Supabase
- `config/ticketing-tiers.json` — tier catalog
- `config.json` — client metadata

## Note

Deployment tooling starts clean — Vercel project config was removed from this directory only.
