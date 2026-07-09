# Klaviyo Setup Guide for Farmer Banks Ticket System

## Context
You are helping set up Klaviyo for the Farmer Banks Harvest Experience ticket system. The webhook triggers a "Ticket Purchased" event in Klaviyo with all ticket data, and we need to create a Flow to send transactional emails with the ticket QR codes.

## Step-by-Step Klaviyo Flow Setup

### Step 1: Create the Flow
1. Log into Klaviyo Dashboard
2. Navigate to **Flows** (left sidebar)
3. Click **"Create Flow"**
4. Select **"Start from scratch"** or **"Event-triggered"**
5. Name the flow: **"Ticket Confirmation Email"**

### Step 2: Set Up the Trigger
1. In the Flow builder, click **"Start"** or **"Add Trigger"**
2. Select **"Event"** as trigger type
3. Choose event: **"Ticket Purchased"**
   - If you don't see it, the event will be created automatically when the webhook sends it
   - You can also manually create it: **Metrics** → **Create Metric** → Name: "Ticket Purchased"
4. Set filter (optional): Leave default (all events)

### Step 3: Design the Email Template
1. Click **"Add Step"** → **"Send Email"**
2. Click on the email step to edit
3. **Email Settings:**
   - Subject line: `Your {{ eventName }} Tickets - {{ eventDate }}`
   - From name: "Farmer Banks"
   - From email: Your verified sender email

### Step 4: Build the Email Content
Use these Klaviyo properties in your email template:

**Available Properties:**
- `{{ eventName }}` - Event name (e.g., "Cassava Harvest")
- `{{ eventDate }}` - Event date (e.g., "2026-01-03")
- `{{ eventTime }}` - Event time (e.g., "8:00 AM - 10:00 AM EST")
- `{{ eventVenue }}` - Venue (e.g., "Here On The Farm")
- `{{ organizerName }}` - Organizer (e.g., "Farmer Banks Helfrich")
- `{{ transactionId }}` - Transaction ID
- `{{ ticketCount }}` - Number of tickets purchased
- `{{ ticketNumber }}` - Ticket number (1, 2, 3, etc.)
- `{{ tier }}` - Ticket tier (basic, premium, etc.)
- `{{ amount }}` - Amount paid
- `{{ qrCodeUrl }}` - QR code image URL (base64 data URL)
- `{{ customerName }}` - Customer name
- `{{ purchaseDate }}` - Purchase date/time

**Email Template Structure:**
```
Subject: Your {{ eventName }} Tickets - {{ eventDate }}

Hi {{ customerName }},

Thank you for your purchase! Your tickets for {{ eventName }} are confirmed.

Event Details:
- Date: {{ eventDate }}
- Time: {{ eventTime }}
- Venue: {{ eventVenue }}
- Organizer: {{ organizerName }}

Ticket Information:
- Quantity: {{ ticketCount }} ticket(s)
- Tier: {{ tier }}
- Transaction ID: {{ transactionId }}

[QR CODE IMAGE - Use {{ qrCodeUrl }} in an <img> tag]

Your ticket QR code is above. Please present this at the event entrance.

Questions? Contact {{ organizerName }}.

See you at the farm!
```

### Step 5: Add QR Code Image
1. In the email editor, add an image block
2. For the image source, use: `{{ qrCodeUrl }}`
   - Note: This is a base64 data URL, so it should work directly in an `<img src="{{ qrCodeUrl }}">` tag
3. Set image width: 300px (recommended)
4. Add alt text: "Ticket QR Code"

### Step 6: Apply for Transactional Status
1. In the email step settings, look for **"Email Type"** or **"Transactional"**
2. Click **"Apply for Transactional Status"**
3. Fill out the form:
   - Email type: Transactional
   - Reason: "Order/ticket confirmation email"
   - Frequency: "Per transaction"
4. Submit for review (usually approved within 24 hours)
5. **Important:** Transactional emails bypass unsubscribe lists, so customers will always receive ticket confirmations

### Step 7: Test the Flow
1. Click **"Send Test"** in the Flow builder
2. Use a test email address
3. Check that:
   - Email is received
   - All properties display correctly
   - QR code image displays
   - Formatting looks good

### Step 8: Activate the Flow
1. Click **"Activate"** or **"Publish"** in the Flow builder
2. Flow is now live and will trigger when "Ticket Purchased" events are sent

## Verification Checklist

After setup, verify:
- [ ] Flow is created and activated
- [ ] Trigger is set to "Ticket Purchased" event
- [ ] Email template includes all ticket details
- [ ] QR code image is included and displays correctly
- [ ] Transactional status is applied for (or approved)
- [ ] Test email was received successfully
- [ ] All Klaviyo properties are displaying correctly

## Testing the Full Flow

1. Make a test purchase on the Farmer Banks site
2. Complete payment on Stripe Checkout
3. Check Vercel logs to confirm:
   - Webhook received payment
   - Klaviyo event triggered
   - Event ID is logged
4. Check Klaviyo:
   - Go to **Metrics** → **Ticket Purchased** → View recent events
   - Verify event data is correct
5. Check email inbox:
   - Should receive ticket confirmation email
   - QR code should display
   - All details should be correct

## Troubleshooting

**Event not appearing in Klaviyo:**
- Check Vercel logs for webhook errors
- Verify `KLAVIYO_PRIVATE_KEY` is set in Vercel
- Check Klaviyo API key is correct

**Email not sending:**
- Verify Flow is activated
- Check Flow trigger matches event name exactly ("Ticket Purchased")
- Verify transactional status is approved
- Check email didn't go to spam

**QR code not displaying:**
- Verify `qrCodeUrl` property is being sent
- Check image tag syntax in email template
- Test with a direct base64 image URL

**Properties not displaying:**
- Verify property names match exactly (case-sensitive)
- Check event data in Klaviyo Metrics to see what was sent
- Use Klaviyo's preview/test feature to debug

## Additional Resources

- Klaviyo Flow Documentation: https://help.klaviyo.com/hc/en-us/articles/115005249073
- Transactional Emails: https://help.klaviyo.com/hc/en-us/articles/360003165732
- Event API: https://developers.klaviyo.com/en/reference/create-event

---

## Overall Farmer Banks Project Checklist

### ✅ Completed
- [x] Stripe Checkout Session integration
- [x] Webhook handler for post-payment flow
- [x] QR code generation with full event details
- [x] Ticket preview endpoint
- [x] Klaviyo profile sync
- [x] Klaviyo event trigger for emails
- [x] Success page
- [x] Wallet-style ticket design

### 🔄 In Progress / Setup Required
- [ ] Klaviyo Flow creation (follow guide above)
- [ ] Klaviyo transactional email approval
- [ ] Test full payment flow end-to-end
- [ ] Verify email delivery

### 📋 Environment Variables (Vercel)
- [x] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [x] `STRIPE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY` - Stripe API key
- [ ] `KLAVIYO_PRIVATE_KEY` - Klaviyo private API key (if not set)

### 🧪 Testing Checklist
- [ ] Test payment flow on site
- [ ] Verify webhook receives payment
- [ ] Check Klaviyo profile is created/updated
- [ ] Verify "Ticket Purchased" event appears in Klaviyo
- [ ] Confirm email is received with QR code
- [ ] Test QR code scanning
- [ ] Verify all ticket details in email

### 🚀 Deployment Status
- [x] Code deployed to Vercel
- [x] Stripe webhook configured
- [ ] Klaviyo Flow configured (in progress)
- [ ] End-to-end testing complete

---

**Next Steps:**
1. Follow the Klaviyo Flow setup guide above
2. Test the full payment flow
3. Verify email delivery
4. Test QR code scanning
5. Go live! 🎉

