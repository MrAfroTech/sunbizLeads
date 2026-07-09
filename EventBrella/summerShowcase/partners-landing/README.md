# Orlando Pirates × Seamlessly Partners Landing

Promotional page for bars and restaurants to join the Game Day Program.

## Setup

1. **Supabase**
   - Run `../supabase-partnership-inquiries.sql` in the Supabase SQL Editor.
   - Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) are set where the API runs.

2. **Form submission**
   - **Option A (recommended):** Deploy this page with the Orlando Pirates app so it shares the same origin. The form POSTs to `/api/partnership-inquiry`, which writes to `partnership_inquiries`.
   - **Option B:** Use client-side Supabase. Before deploy, set `window.SUPABASE_URL` and `window.SUPABASE_ANON` (e.g. via inline config or build-time env).
   - **Option C:** Set `window.API_PARTNERSHIP` to your API URL if the endpoint lives elsewhere.

## Deployment

- **Static:** Serve `index.html` and `orlandopirateslogo.svg` from any static host.
- **Orlando Pirates app (Vercel):** Add a rewrite so `/orlando-pirates-partners` (or `/partners-landing`) serves `partners-landing/index.html`, and ensure `api/partnership-inquiry.js` is deployed as a serverless function.

## SEO

- Target terms: "Orlando Pirates partnerships", "Kia Center restaurants", "game day program", "Arena District".
- Update `og:image` / `twitter:image` when you have a share image.
