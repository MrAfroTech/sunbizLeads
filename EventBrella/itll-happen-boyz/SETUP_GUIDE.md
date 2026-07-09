# Farmer Banks Farm Tour - Setup Guide

## Prerequisites

1. Node.js (v16 or higher)
2. Stripe account with API keys
3. Klaviyo account with API key
4. (Optional) AWS account for DynamoDB storage

## Installation Steps

### 1. Install Dependencies

```bash
cd EventBrella/farmerBanks
npm install
```

### 2. Configure Environment Variables

Copy the example config file and fill in your credentials:

```bash
cp config/config.env.example config/config.env
```

Edit `config/config.env` with your actual values:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Klaviyo
KLAVIYO_PRIVATE_API_KEY=your_klaviyo_key
KLAVIYO_LIST_ID_BIWEEKLY=list_id_1
KLAVIYO_LIST_ID_LATE_WINTER=list_id_2
KLAVIYO_LIST_ID_EARLY_SPRING=list_id_3
```

### 3. Set Up Klaviyo Lists

1. Log into your Klaviyo account
2. Create three lists:
   - **Bi-Weekly Farm Tours** - for regular tour attendees
   - **Late Winter Harvest** - for late winter event registrants
   - **Early Spring Harvest** - for early spring event registrants
3. Copy the list IDs and add them to `config.env`

### 4. Configure Stripe Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/farmerBanks/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy the webhook signing secret to `config.env`

### 5. Update Frontend Stripe Key

Edit `frontend/js/app.js` and update the Stripe publishable key:

```javascript
const stripe = Stripe('pk_live_your_publishable_key_here');
```

Or set it via environment variable if using a build process.

### 6. Deploy API Routes

#### Option A: Vercel Deployment

1. Ensure `vercel.json` includes routes for farmerBanks API
2. Deploy to Vercel
3. Set environment variables in Vercel dashboard

#### Option B: AWS Lambda

1. Package API functions
2. Deploy to AWS Lambda
3. Set up API Gateway endpoints
4. Update API_BASE_URL in frontend

### 7. Set Up Database (Optional)

If using DynamoDB:

1. Create tables using schemas in `schemas/` folder
2. Set up AWS credentials
3. Configure table names in `config.env`

## Testing

### Test Payment Flow

1. Open the splash page
2. Select a ticket tier
3. Fill in test payment details (use Stripe test cards)
4. Complete purchase
5. Verify:
   - QR code generation
   - Email sent (check Klaviyo)
   - Payment recorded

### Test Stripe Webhook

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/farmerBanks/stripe-webhook
stripe trigger payment_intent.succeeded
```

## CSV Upload for Klaviyo

### CSV Format

Each CSV should have the following columns:

```
email,first_name,last_name,ticket_tier,event_date,qr_code_url,transaction_id
customer@example.com,John,Doe,bi-weekly,2025-01-29,data:image/png;base64...,TXN_ABC123
```

### Upload Process

1. Export ticket data from database
2. Format as CSV
3. Upload to Klaviyo via:
   - Klaviyo Dashboard > Lists > Import
   - Or use Klaviyo API

## Troubleshooting

### Payment Not Processing

- Check Stripe API keys are correct
- Verify webhook endpoint is accessible
- Check browser console for errors

### QR Codes Not Generating

- Ensure `qrcode` package is installed
- Check API endpoint is accessible
- Verify transaction data is valid

### Klaviyo Sync Failing

- Verify API key is correct
- Check list IDs exist
- Ensure email format is valid

### Email Not Sending

- Check Klaviyo automation flows are set up
- Verify email templates include QR code
- Test Klaviyo profile creation

## Next Steps

1. Customize splash page design
2. Add Farmer Banks branding/images
3. Set up Klaviyo email automation flows
4. Configure event dates and capacity
5. Test end-to-end flow
6. Deploy to production

## Support

For issues or questions, refer to:
- EventBrella documentation
- Stripe API docs
- Klaviyo API docs



