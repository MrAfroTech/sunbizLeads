# Going Live - Production Environment Variables

## Overview
The codebase automatically detects **live mode** when live Stripe keys are present. To go live, you need to update your Vercel environment variables.

## Required Environment Variables for Production

### 1. Stripe Live Keys (REQUIRED)
These are your **live/production** Stripe keys (starts with `sk_live_` and `pk_live_`):

```
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_LIVE_SECRET=whsec_xxxxxxxxxxxxx
```

**Where to find these:**
- **STRIPE_LIVE_SECRET_KEY**: Stripe Dashboard → Developers → API keys → Secret key (live)
- **STRIPE_PUBLISHABLE_KEY**: Stripe Dashboard → Developers → API keys → Publishable key (live)
- **STRIPE_WEBHOOK_LIVE_SECRET**: Stripe Dashboard → Developers → Webhooks → Your webhook endpoint → Signing secret

### 2. Test Mode Toggle (REQUIRED)
Set this to `false` or remove it entirely:

```
TEST_MODE=false
```

**OR** simply delete the `TEST_MODE` variable from Vercel.

### 3. Base URL (REQUIRED)
Set to your production domain:

```
BASE_URL=https://farmerbanks.eventbrella.us
```

### 4. Klaviyo (REQUIRED - No change needed)
Your Klaviyo key should already be set:

```
KLAVIYO_PRIVATE_KEY=pk_xxxxxxxxxxxxx
```

**Note:** Klaviyo doesn't have separate test/live keys - same key works for both.

### 5. Supabase (REQUIRED - No change needed)
Your Supabase credentials should already be set:

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxx
```

**Note:** Supabase doesn't have separate test/live environments - same credentials work.

## How the Code Detects Live Mode

### In `stripe-webhook.js`:
```javascript
// Automatically detects live mode if STRIPE_LIVE_SECRET_KEY exists
const IS_TEST_MODE = process.env.TEST_MODE === 'true' || 
                     (STRIPE_TEST_SECRET_KEY && !STRIPE_LIVE_SECRET_KEY) ||
                     (STRIPE_TEST_SECRET_KEY && STRIPE_TEST_SECRET_KEY.startsWith('sk_test_'));

// Uses live keys if not in test mode
const STRIPE_SECRET_KEY = IS_TEST_MODE ? STRIPE_TEST_SECRET_KEY : STRIPE_LIVE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = IS_TEST_MODE 
  ? process.env.STRIPE_WEBHOOK_TEST_SECRET 
  : process.env.STRIPE_WEBHOOK_LIVE_SECRET;
```

### In `stripe-payment.js`:
```javascript
// Falls back to live key if test key not found
const STRIPE_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const TEST_MODE = process.env.TEST_MODE === 'true' || !STRIPE_SECRET_KEY;
```

## Steps to Go Live in Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add/Update these variables:**
   - `STRIPE_LIVE_SECRET_KEY` = `sk_live_...` (your live secret key)
   - `STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (your live publishable key)
   - `STRIPE_WEBHOOK_LIVE_SECRET` = `whsec_...` (your live webhook signing secret)
   - `BASE_URL` = `https://farmerbanks.eventbrella.us`
   - `TEST_MODE` = `false` (or delete it)

3. **Keep these existing variables:**
   - `KLAVIYO_PRIVATE_KEY` (no change needed)
   - `SUPABASE_URL` (no change needed)
   - `SUPABASE_ANON_KEY` (no change needed)

4. **Optional - Remove test keys** (or keep them for testing):
   - `STRIPE_TEST_SECRET_KEY` (can keep for testing)
   - `STRIPE_WEBHOOK_TEST_SECRET` (can keep for testing)

5. **Redeploy** your application after updating variables

## Verify You're in Live Mode

After deploying, check the Vercel function logs:

1. Look for: `🔧 Using webhook secret: STRIPE_WEBHOOK_LIVE_SECRET`
2. Look for: `🔧 Stripe initialized: { testMode: false, ... }`
3. Test a payment - it should redirect to Stripe's **live** checkout (not test mode)

## Important Notes

⚠️ **Stripe Webhook Endpoint:**
- Make sure your Stripe webhook endpoint in Stripe Dashboard is pointing to:
  `https://farmerbanks.eventbrella.us/api/stripe-webhook`
- The webhook must be set to **live mode** (not test mode) in Stripe Dashboard
- Copy the **live** signing secret to `STRIPE_WEBHOOK_LIVE_SECRET`

⚠️ **Frontend Stripe Key:**
- The frontend JavaScript uses `STRIPE_PUBLISHABLE_KEY`
- Make sure this is set to your **live** publishable key (`pk_live_...`)
- If you have a `.env` file in the root, update it there too (though Vercel env vars take precedence)

⚠️ **Testing:**
- You can keep test keys in Vercel for local testing
- The code will automatically use live keys when `STRIPE_LIVE_SECRET_KEY` is present and `TEST_MODE` is not `true`

## Checklist Before Going Live

- [ ] Stripe live secret key added to Vercel
- [ ] Stripe live publishable key added to Vercel
- [ ] Stripe live webhook secret added to Vercel
- [ ] Stripe webhook endpoint configured in Stripe Dashboard (live mode)
- [ ] `TEST_MODE` set to `false` or removed
- [ ] `BASE_URL` set to production domain
- [ ] Klaviyo key configured (no change needed)
- [ ] Supabase credentials configured (no change needed)
- [ ] Application redeployed
- [ ] Test payment completed successfully
- [ ] Webhook received and processed
- [ ] Email sent with ticket and QR code








