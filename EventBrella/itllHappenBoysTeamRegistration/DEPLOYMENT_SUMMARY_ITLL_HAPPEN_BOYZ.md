# Client System Ready: It'll Happen Boyz Summer Showcase

**Directory:** `/Users/missioncontrol/SeamlessMarketplace/EventBrella/itll-happen-boyz/`

**Production URL:** `https://itll-happen-boyz.eventbrella.us`

---

## Execution Summary

- **Step 1:** New client directory created at `itll-happen-boyz/`; template copied from `whiteLabelDigitalTicketingSystem/` (excluded `.vercel`, `node_modules`, `.git`).
- **Step 1.5:** `package.json` updated: `name` = `itll-happen-boyz`, scripts added: `build`, `dev`, `start`, `deploy`. Stripe dependency present.
- **Step 2:** All identity, venue, contact, event, and copy placeholders replaced with It'll Happen Boyz values across `public/`, `api/`, and `config/`.
- **Step 3:** `config/ticketing-tiers.json` created with 4 tiers: Day Pass ($20), Weekend Pass ($52), VIP Day Pass ($60), VIP Weekend Pass ($152). `public/js/app.js` and `api/stripe-payment.js` updated with tier IDs and prices.
- **Step 4:** No client images provided; hero/organizer/poster image refs set to empty or CSS background to solid color. Add assets to `public/images/` when available.
- **Step 5:** `config/config.env` created/updated with client identity, BASE_URL, venue, events, and placeholders for Stripe/Turnstile/email (copy from FarmerBanks per STEP 5.5).
- **Step 5.5:** Run from client dir: `./scripts/setup-vercel-stripe-env.sh https://itll-happen-boyz.eventbrella.us` (after Vercel project linked; copies FarmerBanks .env, creates webhook, adds Stripe + Turnstile to Vercel).
- **Step 6:** No `emails/` folder in template; email templates (e.g. ticket-confirmation, order-receipt) are typically in API or Klaviyo. Replace any `CLIENT_*` in those when configuring.
- **Step 7:** Verification — no customer-facing HTML/JS/CSS contain literal `CLIENT_` placeholders. API code uses `process.env.CLIENT_*` with safe fallbacks (TBA, Summer Showcase 2026, etc.). Template tools (`prompt-template.js`, `white-label-form.html`) retain `CLIENT_` as form/placeholder names by design.

---

## Next Steps for Developer

1. **Add client images** (optional) to `public/images/`:
   - Organizer/host photo
   - Hero background (then set in `public/styles/main.css` and any page-level hero styles)
   - Event poster (homepage hero)
   - About/Events left and right photos (if using farm-tours / harvest-experiences pages)

2. **Test scripts:**
   ```bash
   cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/itll-happen-boyz/
   npm install
   npm run build   # Should echo "Static site - no build step required"
   npm run dev     # Should start Vercel dev server
   ```

3. **Configure Stripe + Vercel env** (run once from client dir):
   ```bash
   chmod +x scripts/setup-vercel-stripe-env.sh
   ./scripts/setup-vercel-stripe-env.sh https://itll-happen-boyz.eventbrella.us
   ```
   Ensure FarmerBanks `.env` exists at `../farmerBanks/.env` with STRIPE_* and TEST_MODE. Script creates webhook and adds Stripe + Turnstile + TEST_MODE to this project’s Vercel env.

4. **Configure email:** Add Klaviyo or SendGrid API keys to Vercel environment variables when ready.

5. **Deploy:**
   ```bash
   cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/itll-happen-boyz/
   vercel --prod
   ```

6. **Test workflow:**
   - [ ] Event pages load (/, /allevents.html)
   - [ ] Checkout (Get Tickets) opens modal; tier and price correct
   - [ ] Stripe payment (test mode) completes
   - [ ] Confirmation emails send (after email config)
   - [ ] Tickets display with QR codes

---

## Points of Contact (on site / footer)

1. **Coach Kei** | info@itllhappenboyz.com | 321-477-9140 | Head Coach  
2. **Coach Lee** | info@itllhappenboyz.com | 407-760-7136 | Assistant Coach  

---

## Critical Files Check

- [x] `package.json` — name `itll-happen-boyz`, scripts: build, dev, start, deploy
- [x] `public/index.html` — Summer Showcase 2026, 4 tiers, venue/contact
- [x] `public/js/app.js` — TICKET_PRICES and tierNames for day-pass, weekend-pass, vip-day-pass, vip-weekend-pass
- [x] `public/js/allevents.js` — Single MAIN_EVENT (Summer Showcase 2026) with 4 tiers
- [x] `config.json` — clientName, homeUrl for itll-happen-boyz.eventbrella.us
- [x] `config/config.env` — Client identity, BASE_URL, venue, events, Stripe/Turnstile placeholders
- [x] `config/ticketing-tiers.json` — 4 tiers with price and capacity
- [x] `api/events.js` — loadEventsFromTiers() for ticketing-tiers; DEFAULT_ORGANIZER/VENUE fallbacks set
- [x] `api/stripe-payment.js` — validTiers and tierPrices for 4 tiers; BASE_URL and metadata fallbacks set
- [x] `vercel.json` — present (from template)

---

## Template Directory

Template at `/Users/missioncontrol/SeamlessMarketplace/EventBrella/whiteLabelDigitalTicketingSystem/` was not modified.
