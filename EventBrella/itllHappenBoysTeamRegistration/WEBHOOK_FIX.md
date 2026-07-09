# Stripe Webhook 400 Error Fix

## Issue
Vercel returns 400 errors on Stripe webhooks even though the signing secret matches.

## Root Cause
Stripe requires the **raw request body** to verify the signature. Vercel automatically parses JSON in API routes, so `req.body` is already parsed—`stripe.webhooks.constructEvent` fails, returning 400.

## Fix Applied

1. **Disabled Vercel's automatic body parsing** in `api/stripe-webhook.js`:
   ```js
   module.exports.config = {
     api: {
       bodyParser: false, // required for Stripe signature verification
     },
   };
   ```

2. Using `getRawBody(req)` to read the unparsed body stream

3. Config added at the end of the file

## Testing

After deploying, test via Stripe CLI:
```bash
stripe listen --forward-to https://farmer-banks.vercel.app/api/stripe-webhook
stripe trigger checkout.session.completed
```

**Expected logs:**
- `✅ Raw body read successfully`
- `✅ Webhook verified: checkout.session.completed`
- `✅ Webhook processed successfully`

## Summary
Vercel parses JSON by default, breaking Stripe's signature check. Disabling the body parser ensures the raw body is available for verification.

