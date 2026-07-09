# Vercel Environment Variables - Complete List

**Template/baseline.**  
- **Service-level (not templated):** Stripe and Klaviyo are tied to the service we provide (EventBrella). Same account/keys across clients; set in deployment env once for the service.  
- **Per client:** `DATABASE_URL`, `BASE_URL`, `ORGANIZER_NAME`, `APP_NAME`, and copy/assets. See [SOP_ONBOARDING_NEW_TICKETING_CLIENT.md](./SOP_ONBOARDING_NEW_TICKETING_CLIENT.md).

## Required Variables (Must Have)

### 1. Database Connection (per client)
```
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Required**: Yes (per client)
- **Description**: PostgreSQL connection string for this client’s data
- **How to get**: Vercel Postgres, Supabase, Neon, etc. → connection string (URI)

### 2. Stripe Keys — Service-Level (EventBrella’s; not per client)
```
STRIPE_TEST_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_TEST_SECRET=whsec_xxxxx
```
- **Required**: Yes (for payments)
- **Description**: EventBrella’s Stripe account; shared across clients. Not templated.
- **How to get**: Our Stripe Dashboard → Developers → API keys
- **Note**: Use test keys for dev, live keys for production; same Stripe for all clients.

### 3. Klaviyo API Key — Service-Level (EventBrella’s; not per client)
```
KLAVIYO_PRIVATE_KEY=pk_xxxxx
```
OR
```
KLAVIYO_PRIVATE_API_KEY=pk_xxxxx
```
- **Required**: Yes (for ticket emails)
- **Description**: EventBrella’s Klaviyo account; shared across clients. Not templated.
- **How to get**: Our Klaviyo Dashboard → Account → Settings → API Keys

## Optional Variables (Recommended)

### 4. Base URL (client-specific)
```
BASE_URL=https://CLIENT_SUBDOMAIN.eventbrella.us
```
- **Required**: No (has fallback)
- **Description**: This client's production domain URL
- **Use**: For generating QR codes and webhook URLs. Replace `CLIENT_SUBDOMAIN` per client.

### 5. Ticket Pricing
```
TIER_BASIC_PRICE=1000
```
- **Required**: No (defaults to $10.00 = 1000 cents)
- **Description**: Price for basic tier tickets in cents
- **Default**: `1000` (=$10.00)

### 6. Test Mode
```
TEST_MODE=false
```
- **Required**: No
- **Description**: Enable test mode (uses test Stripe keys)
- **Default**: Auto-detected from Stripe keys
- **Use**: Set to `true` for testing, `false` for production

## Production vs Test Variables

### For Test/Development:
```
# Per client
DATABASE_URL=postgresql://...
BASE_URL=https://<client-subdomain>.eventbrella.us
ORGANIZER_NAME=<Client Organizer Display Name>

# Service-level (EventBrella’s; same for all)
STRIPE_TEST_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_TEST_SECRET=whsec_xxxxx
KLAVIYO_PRIVATE_KEY=pk_xxxxx

TEST_MODE=true
```

### For Production:
```
# Per client
DATABASE_URL=postgresql://...
BASE_URL=https://<client-subdomain>.eventbrella.us
ORGANIZER_NAME=<Client Organizer Display Name>

# Service-level (EventBrella’s; same for all)
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_LIVE_SECRET=whsec_xxxxx
KLAVIYO_PRIVATE_KEY=pk_xxxxx

TEST_MODE=false
```

## How to Add in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter:
   - **Name**: (variable name from above)
   - **Value**: (your actual value)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **"Save"**
6. **Redeploy** your project

## Quick Checklist

**Per client (each new deployment):**
- [ ] `DATABASE_URL` – PostgreSQL for this client
- [ ] `BASE_URL` – This client’s domain
- [ ] `ORGANIZER_NAME` – For metadata and copy

**Service-level (EventBrella; not templated, same across clients):**
- [ ] Stripe keys (test/live) – Our Stripe account
- [ ] `KLAVIYO_PRIVATE_KEY` or `KLAVIYO_PRIVATE_API_KEY` – Our Klaviyo account

## Notes

- **Never commit** these values to git
- **Use different keys** for test vs production
- **Redeploy** after adding/changing environment variables
- **Test** after deployment to ensure everything works

## Troubleshooting

### "Ticket not found" error
- Check `DATABASE_URL` is set correctly
- Verify connection string includes password
- Test connection in Supabase

### Payment fails
- Check Stripe keys are correct
- Verify webhook secret matches Stripe dashboard
- Check `BASE_URL` is correct

### Emails not sending
- Verify `KLAVIYO_PRIVATE_KEY` is set
- Check Klaviyo Flow is activated
- Test with Klaviyo test event








