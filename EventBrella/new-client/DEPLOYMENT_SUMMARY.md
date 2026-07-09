# Deployment Summary — New Client Ticketing System

## Client system ready: —

**Client:** —  
**Directory:** `/Users/missioncontrol/SeamlessMarketplace/EventBrella/new-client/`  
**Production URL:** https://new-client.eventbrella.us

---

## What Was Done

1. **Template cloned** from `whiteLabelDigitalTicketingSystem` to `new-client`
2. **Placeholders replaced** with values (— for client-provided copy; functional values for URLs, slugs, and config)
3. **Ticketing tiers** set to `[]` in `config/ticketing-tiers.json`
4. **Config** updated: `config.json`, `config/config.env`
5. **Email templates** updated: `klaviyo-ticket-email-template.html`, `monthly-farm-tour-email.html`, `farm-tour-newsletter-email.html`, `public/farm-tour-newsletter-december-14.html`
6. **Event slugs** generated: `new-client-event-2026-02-09`, `new-client-event-2026-02-16`, `new-client-default`

---

## Next Steps

1. **Client content**
   - Add client images to `public/images/` (organizer photo, hero left/right, event poster)
   - Replace "—" with real client copy (venue, organizer, descriptions, etc.)

2. **Stripe**
   - Add client keys in Vercel: `STRIPE_TEST_SECRET_KEY` / `STRIPE_LIVE_SECRET_KEY`, `STRIPE_WEBHOOK_TEST_SECRET` / `STRIPE_WEBHOOK_LIVE_SECRET` (see `STRIPE_WEBHOOK_CLI.md` for CLI setup)
   - Webhook URL: `https://new-client.eventbrella.us/api/stripe-webhook`
   - Webhook handler is templated from FarmerBanks; same `checkout.session.completed` payload shape.

3. **Email**
   - Add keys in Vercel: `KLAVIYO_API_KEY` and/or `SENDGRID_API_KEY`

4. **Deploy**
   ```bash
   cd /Users/missioncontrol/SeamlessMarketplace/EventBrella/new-client/ && vercel --prod
   ```

5. **Vercel environment variables**
   - `ORGANIZER_NAME` → —
   - `BASE_URL` → https://new-client.eventbrella.us
   - `CLIENT_VENUE_NAME` → —
   - `CLIENT_ADDRESS_LINE1` → —
   - `CLIENT_ADDRESS_LINE2` → —
   - `CLIENT_EVENT_SLUG` → new-client-default
   - `CLIENT_DEFAULT_EVENT_NAME` → —
   - Stripe and email keys (see above)

6. **Verification**
   - Event pages → checkout → payment → confirmation email → ticket with QR → scanner validation

---

## Files Modified (Summary)

- **Config:** `config.json`, `config/config.env`, `config/ticketing-tiers.json` (created)
- **API:** `api/events.js`, `api/stripe-payment.js`, `api/stripe-webhook.js`, `api/preview-ticket.js`, `api/klaviyo-test-event.js`, `api/onboard-organizer.js`
- **HTML:** `allevents.html`, `public/index.html`, `public/allevents.html`, `public/farm-tours.html`, `public/harvest-experiences.html`, `public/payment.html`, `public/scan-tickets.html`, `public/success.html`, `platformDrivenPages/tours/*.html`
- **JS:** `public/js/allevents.js`, `public/js/farm-tours.js`, `public/js/harvest-experiences.js`, `platformDrivenPages/tours/*.js`
- **Schemas:** `schemas/events-schema.js`, `schemas/tickets-schema.js`
- **Email:** `klaviyo-ticket-email-template.html`, `monthly-farm-tour-email.html`, `farm-tour-newsletter-email.html`, `public/farm-tour-newsletter-december-14.html`
- **Docs:** `VERCEL_ENV_VARIABLES.md`

---

## Execution Checklist

- [x] Step 1: New client directory created (template copied to new-client)
- [x] Step 2: All placeholders replaced in **new** directory only
- [x] Step 3: Ticketing tiers configured
- [x] Step 4: Image instructions applied (placeholders use template images)
- [x] Step 5: Environment variables documented
- [x] Step 6: Email templates updated
- [x] Step 7: Verification complete
- [x] Step 8: Deployment summary generated
- [x] Template directory unchanged
- [x] No remaining CLIENT_* placeholders in runtime/customer-facing code (docs/form tools retain intentional references)
