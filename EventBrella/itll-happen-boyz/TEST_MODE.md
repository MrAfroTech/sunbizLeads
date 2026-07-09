# Test Mode Configuration

## Overview

The Farmer Banks Farm Tour platform is currently configured to run in **TEST MODE**, which means:

- ✅ No real Stripe payments are processed
- ✅ No actual Klaviyo API calls are made
- ✅ All payment flows are simulated
- ✅ QR codes are still generated (real functionality)
- ✅ All data structures and flows work as expected

## How Test Mode Works

### Frontend (Test Mode)

- Stripe.js is not loaded
- Payment form shows "TEST MODE" message
- Payment confirmation is simulated
- All API calls work normally but return mock data

### Backend API (Test Mode)

All API endpoints check for `TEST_MODE=true` in environment variables:

1. **stripe-payment.js**
   - Returns mock payment intent with test IDs
   - No actual Stripe API calls
   - Transaction IDs are still generated

2. **klaviyo-sync.js**
   - Returns mock profile IDs
   - No actual Klaviyo API calls
   - Logs what would be sent to Klaviyo

3. **generate-qr.js**
   - Works normally (generates real QR codes)
   - No external dependencies

4. **ticket-confirmation.js**
   - Works normally (prepares email HTML)
   - Email sending is logged but not sent

## Configuration

Test mode is enabled by default. To enable/disable:

### Enable Test Mode

Set in `config/config.env`:
```env
TEST_MODE=true
```

Or simply don't set Stripe/Klaviyo keys (test mode auto-enables).

### Disable Test Mode (Production)

1. Set `TEST_MODE=false` in `config/config.env`
2. Add real Stripe keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. Add Klaviyo key:
   ```env
   KLAVIYO_PRIVATE_API_KEY=your_key_here
   ```
4. Update frontend `app.js`:
   ```javascript
   const TEST_MODE = false;
   ```
5. Update `index.html` to load Stripe.js:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```

## Testing the Flow

### 1. Open the Splash Page
- Navigate to `/farmerBanks/frontend/index.html`
- You should see the farm tour page

### 2. Select a Ticket Tier
- Click "Select Tickets" on any tier card
- Payment modal opens

### 3. Fill in Form
- Enter test customer information
- Select an event date
- Choose number of tickets
- Notice the "TEST MODE" message instead of card input

### 4. Submit Payment
- Click "Purchase Tickets"
- Payment is simulated (no real charge)
- Success modal appears with transaction ID

### 5. Verify Results
- Check browser console for logs
- QR code should be generated
- Mock Klaviyo sync should complete
- Email template should be prepared

## Test Mode Indicators

You'll see these indicators that test mode is active:

1. **Frontend:**
   - "🧪 TEST MODE" message in payment form
   - No Stripe card input field
   - Console logs show "TEST MODE: Simulating..."

2. **Backend:**
   - API responses include `"testMode": true`
   - Console logs show "🧪 TEST MODE: ..."
   - Mock IDs are generated (e.g., `pi_test_...`, `cus_test_...`)

## What Still Works in Test Mode

✅ QR code generation (real QR codes)
✅ Ticket data structures
✅ Event calendar
✅ Form validation
✅ All UI interactions
✅ Email template generation
✅ Transaction ID generation

## What's Simulated in Test Mode

❌ Stripe payment processing
❌ Klaviyo profile creation
❌ Klaviyo list additions
❌ Actual email sending
❌ Webhook processing

## Switching to Production

When ready to go live:

1. **Update Configuration:**
   ```env
   TEST_MODE=false
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   KLAVIYO_PRIVATE_API_KEY=...
   ```

2. **Update Frontend:**
   - Set `TEST_MODE = false` in `frontend/js/app.js`
   - Enable Stripe.js loading in `frontend/index.html`

3. **Test with Real APIs:**
   - Use Stripe test mode first
   - Verify Klaviyo integration
   - Test email delivery

4. **Deploy:**
   - Set environment variables in deployment platform
   - Deploy updated code
   - Monitor for errors

## Troubleshooting

### Payment Not Working
- Check that `TEST_MODE=true` is set
- Verify API endpoints are accessible
- Check browser console for errors

### QR Codes Not Generating
- QR code generation works in test mode
- Check API endpoint is accessible
- Verify transaction data is valid

### Want to Test Real Stripe?
- Set `TEST_MODE=false`
- Use Stripe test keys (starts with `sk_test_` and `pk_test_`)
- Test with Stripe test card numbers

## Notes

- Test mode is perfect for development and demos
- All functionality is preserved except external API calls
- Easy to switch between test and production modes
- No risk of accidental charges in test mode



