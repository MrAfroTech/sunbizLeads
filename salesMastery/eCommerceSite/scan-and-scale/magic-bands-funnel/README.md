# MagicBands click-event funnel

Lead-triggered email automation for MagicBands (`public.scan_and_scale_click_events`): owner alert, Email 1 (booking CTA stripped at runtime), optional call task, and scheduled Emails 2–4 via Brevo.

**Product (download / buy):** `magicBandsImplementationGuide.html` — sourced from `../magicBandsImplementationGuide.html` at the scan-and-scale site root. Stripe catalog key: `magic-bands-deployment-blueprint` ($17).

**SOP:** `operatingSeamlessly/Automatins/SOPs/scan-scale-click-event-funnel.md`

## Layout

| Path | Purpose |
|------|---------|
| `magicBandsImplementationGuide.html` | Deployment blueprint (print / PNG ZIP / Stripe buy) |
| `public/magicBandsImplementationGuide.html` | Same guide for `public/` deploy copy |
| `public/js/checkout.js` | Hosted Checkout helper (`POST /api/checkout`) |
| `calculator/` | MagicBands guest-flow calculator + results |
| `migrations/` | Funnel columns + `follow_up_tasks` |
| `config/settings.json` | Owner email, funnel slug, product paths |
| `config/brevo-templates.json` | Brevo template IDs (fill via script) |
| `scripts/create-brevo-templates.mjs` | Uploads `emailSequences/magicBandsSequence` → Brevo |
| `functions/` | `on-new-click-event`, `send-followup-emails`, `_shared/*` |
| `supabase/functions/` | Deno deploy entrypoints |

## Email sequence

Templates live in `salesMastery/emailSequences/magicBandsSequence/` (`magic_bands_email_001.html` … `_004.html`).

Email 1 CTAs:

- **Primary (stripped at send):** `https://scan-and-scale.seamlessly.us/calculator/magic-bands`
- **Secondary (kept):** `https://scan-and-scale.seamlessly.us/magicBandsImplementationGuide.html`

## Deploy checklist

1. **DB** (once per Supabase project): `scan_and_scale_click_events.sql` + `migrations/20250515130000_scan_scale_funnel_columns_and_follow_up_tasks.sql`
2. **Brevo templates:**

   ```bash
   cd salesMastery/eCommerceSite/scan-and-scale/magic-bands-funnel
   export BREVO_API_KEY="…"
   node scripts/create-brevo-templates.mjs
   ```

3. **Edge Functions:**

   ```bash
   supabase link --project-ref <ref>
   supabase secrets set BREVO_API_KEY="<key>"
   supabase functions deploy on-new-click-event --no-verify-jwt
   supabase functions deploy send-followup-emails --no-verify-jwt
   ```

4. **Webhook:** `INSERT` on `public.scan_and_scale_click_events` → `on-new-click-event`
5. **Cron:** daily `send-followup-emails`
6. **Storefront:** copy `public/magicBandsImplementationGuide.html` and `public/js/checkout.js` into `scan-and-scale/public/` if not already present; wire `?campaign=magic-bands-*` on calculator and guide links.

## Campaign values

Use `last_click_campaign` values such as `magic-bands-001`, `magic-bands-calculator`, `magic-bands-blueprint` for reporting.

## Operational notes

- Only **one** active `INSERT` webhook per `scan_and_scale_click_events` table per Supabase project.
- After `brevo-templates.json` changes, redeploy both Edge Functions.
- `email_sequence_days` in `settings.json` is documentation only; follow-up timing is hardcoded at 2 / 4 / 6 days in `send-followup-emails.ts`.
