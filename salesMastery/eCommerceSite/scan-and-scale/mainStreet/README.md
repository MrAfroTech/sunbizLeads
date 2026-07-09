# Main Street — District Retention Gap Funnel

Self-contained funnel for **Main Street America** program coordinators: landing copy, retention gap calculator, results + two-path offer, starter-kit popup, and $17 playbook page.

**Scope:** Everything lives under `mainStreet/`. Do not edit other apps or folders unless you are explicitly wiring deploy routes (outside this package).

## URLs (Vercel production)

| Page | URL |
|------|-----|
| **Splash (start here)** | https://scan-and-scale.seamlessly.us/mainStreet/ |
| Calculator | https://scan-and-scale.seamlessly.us/mainStreet/calculator/ |
| Results | https://scan-and-scale.seamlessly.us/mainStreet/calculator/results |
| $17 playbook | https://scan-and-scale.seamlessly.us/mainStreet/playbook |

Entry point is **`mainStreet/index.html`** (splash), deployed via `vercel-build` → `public/mainStreet/`.

**Deploy:** push to the branch connected to Vercel production, or from `scan-and-scale`: `vercel --prod`. Until that deploy completes, `/mainStreet/` will 404 on prod.

## Calculator math

| Input | Field ID |
|-------|----------|
| Monthly foot traffic | `#footTraffic` |
| % first-time visitors | `#firstTimePct` |
| Average spend per visit | `#avgSpend` |
| % return within 90 days | `#returnPct` |

```
firstTimers = traffic × (firstTimePct / 100)
oneAndDone = firstTimers × (1 − returnPct / 100)
monthlyGap = oneAndDone × avgSpend        // one modeled missed return visit / month
annualGap = monthlyGap × 12
uplift10 = firstTimers × 0.10 × avgSpend × 12
```

Results persist in `sessionStorage` key `ms_district_calc` for the starter-kit popup.

## Lead capture

- **Popup:** 5s delay, `sessionStorage` key `ms_starter_kit_modal_shown` (same pattern as Scan & Scale modals).
- **Fields:** Full Name, Email, Program/City.
- **POST:** `/api/log-site-event` with `campaign: main-street-starter-kit` when served from the Scan & Scale app (requires parent `logSiteEvent` — wire at deploy time only).

## Campaigns (SOP)

| Use | Value |
|-----|--------|
| Calculator traffic | `main-street-retention-001` |
| Starter kit popup | `main-street-starter-kit` |

See `config/settings.json` for owner email, Calendly URL, and Stripe product key placeholder.

## Supabase + Edge Functions

Full step-by-step (tables, webhooks, cron, Brevo, deploy): **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

## Email automation (next step)

Follow `operatingSeamlessly/Automatins/SOPs/scan-scale-click-event-funnel.md`:

1. Create `salesMastery/emailSequences/mainStreetSequence/` (4 HTML emails) — **outside this folder**.
2. Copy `scan-scale-funnel` → `mainStreet/funnels/mainStreet/` and customize Brevo + Edge Functions.
3. Segment with `last_click_campaign` = `main-street-*` on shared `scan_and_scale_click_events`.

**Webhook note:** One `INSERT` webhook per table per Supabase project — use campaign routing or a separate project if multiple niches deploy simultaneously.

## Deploy wiring (parent repo only — when ready)

Add rewrites/static routes in parent `vercel.json` / `server.js`, for example:

- `/mainStreet/calculator` → `mainStreet/calculator/index.html`
- `/mainStreet/calculator/results` → `mainStreet/calculator/results.html`
- `/mainStreet/playbook` → `mainStreet/districtRetentionPlaybook.html`

Add Stripe product `district-retention-playbook` in parent `config/stripe-products.js` when checkout should work from the playbook page.

## Copy map

| Section | Location |
|---------|----------|
| H1 / narrative / CTA | `calculator/index.html` |
| Calculator inputs | `calculator/index.html` |
| Inline results | `calculator/index.html` |
| Post-calc headline + two-path offer | `calculator/results.html` |
| Starter kit popup | `calculator/*.html` + `js/lead-modal.js` |
| $17 playbook sales | `districtRetentionPlaybook.html` |
