# Stripe Webhook Setup via CLI (New Client)

The webhook handler at `api/stripe-webhook.js` is templated from **FarmerBanks** and expects the same `checkout.session.completed` payload shape (metadata: `tier`, `event_time`, `event_venue`, `event_date`, `ticket_count`, `organizer_name`, `event_name`, `customer_name`, `transaction_id`). FarmerBanks is unchanged; this doc is for the **new client** deployment only.

---

## 1. Create webhook endpoint in Stripe (production)

After deploying the new client (e.g. to `https://new-client.eventbrella.us`), create the webhook in Stripe:

```bash
# Replace NEW_CLIENT_URL with your deployed URL, e.g. https://new-client.eventbrella.us
stripe webhook_endpoints create \
  --url "https://NEW_CLIENT_URL/api/stripe-webhook" \
  --enabled-events checkout.session.completed \
  --description "New Client - checkout.session.completed"
```

Stripe will return a **signing secret** (`whsec_...`). Add it to Vercel (or your deployment) as:

- **Test mode:** `STRIPE_WEBHOOK_TEST_SECRET`
- **Live mode:** `STRIPE_WEBHOOK_LIVE_SECRET`

Use the same mode (test vs live) as your Stripe API keys (`STRIPE_TEST_SECRET_KEY` / `STRIPE_LIVE_SECRET_KEY` and `TEST_MODE`).

---

## 2. Local testing with Stripe CLI

Forward Stripe events to your local server:

```bash
# From the new-client directory
cd /path/to/new-client
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Use the signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_TEST_SECRET` in `.env` or `config.env` for local runs.

Trigger a test event:

```bash
stripe trigger checkout.session.completed
```

---

## 3. Event shape (same as FarmerBanks)

The handler expects `event.data.object` (Checkout Session) with `metadata` like:

```json
{
  "metadata": {
    "tier": "basic",
    "event_time": "9:00 AM - 11:00 AM EST",
    "event_venue": "Here On The Farm",
    "event_date": "2026-02-08",
    "ticket_count": "2",
    "organizer_name": "Farmer Banks Helfrich",
    "event_name": "Farm Tour",
    "customer_name": "Maurice Sanders",
    "transaction_id": "TXN_465B5857B742",
    "platform_fee": "false"
  }
}
```

For the new client, send the same keys from your checkout (with client-specific values). The webhook uses env fallbacks when a metadata field is missing: `CLIENT_DEFAULT_EVENT_NAME`, `CLIENT_VENUE_NAME`, `ORGANIZER_NAME`, `BASE_URL`, `CLIENT_SOURCE_ID`.

---

## 4. Checklist

- [ ] New client deployed (e.g. `https://new-client.eventbrella.us`)
- [ ] Webhook endpoint created in Stripe (CLI or Dashboard) pointing to `https://<new-client-url>/api/stripe-webhook`
- [ ] `STRIPE_WEBHOOK_TEST_SECRET` and/or `STRIPE_WEBHOOK_LIVE_SECRET` set in Vercel
- [ ] Checkout session metadata includes: `transaction_id`, `tier`, `event_date`, `ticket_count`, `event_name`, `event_venue`, `organizer_name`, `customer_name`
- [ ] Test with a real or test payment and confirm tickets + Klaviyo (if configured)
