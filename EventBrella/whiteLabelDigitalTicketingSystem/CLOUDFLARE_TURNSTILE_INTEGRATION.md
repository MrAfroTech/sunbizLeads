# Cloudflare Turnstile (checkout bot protection)

Checkout uses **Cloudflare Turnstile**. Same keys as FarmerBanks; no per-client keys.

## Env and Vercel

- **TURNSTILE_SITE_KEY** (public) and **TURNSTILE_SECRET_KEY** (server-only) are in `config/config.env` as placeholders.
- **Copy from FarmerBanks** `.env`, or run **`./scripts/setup-vercel-stripe-env.sh <BASE_URL>`** after creating the new client — that script copies Stripe and Turnstile vars from FarmerBanks into this project’s Vercel env.

## Full integration steps

**Step-by-step (HTML, JS, backend verify, Cloudflare dashboard)** is in the FarmerBanks repo:

- **`../farmerBanks/CLOUDFLARE_TURNSTILE_INTEGRATION.md`**

Use that doc for:

1. Env vars (same .env as this project).
2. Checkout page: Turnstile script in `<head>`, hidden input + widget before submit, `onTurnstileSuccess` callback.
3. Submit: read token, send as `cfTurnstileResponse`, reset widget on error.
4. Backend: read `cfTurnstileResponse`, verify with Turnstile siteverify, reject if invalid.
5. Cloudflare dashboard: add every checkout domain (production, `*.vercel.app`, localhost) for the widget to avoid 110200.

Any codebase that shares the same .env and follows that guide matches the FarmerBanks integration.
