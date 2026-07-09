# Klaviyo Setup - Quick Guide

## Step 1: Verify Event is Being Sent
1. Make a test purchase on your site
2. Check Vercel logs - should see "✅ Klaviyo event triggered"
3. Go to Klaviyo Dashboard → **Metrics** → Look for "Ticket Purchased" event
4. If event doesn't exist, it will be created automatically when first sent

## Step 2: Create Flow
1. Klaviyo Dashboard → **Flows** → **Create Flow**
2. Name: "Ticket Confirmation Email"
3. Select **"Event-triggered"** or **"Start from scratch"**

## Step 3: Set Trigger
1. Click **"Start"** or **"Add Trigger"**
2. Select **"Event"** trigger
3. Choose event: **"Ticket Purchased"**
4. Leave filters as default (all events)

## Step 4: Add Email Step
1. Click **"Add Step"** → **"Send Email"**
2. Click the email step to edit

## Step 5: Configure Email
**Settings:**
- Subject: `Your {{ eventName }} Tickets - {{ eventDate }}`
- From name: "Farmer Banks"
- From email: Your verified sender

**Available Properties:**
- `{{ eventName }}` - Event name
- `{{ eventDate }}` - Event date
- `{{ eventTime }}` - Event time
- `{{ eventVenue }}` - Venue
- `{{ organizerName }}` - Organizer
- `{{ transactionId }}` - Transaction ID
- `{{ ticketCount }}` - Number of tickets
- `{{ ticketNumber }}` - Ticket number (1, 2, 3...)
- `{{ tier }}` - Ticket tier
- `{{ amount }}` - Amount paid
- `{{ qrCodeUrl }}` - QR code image (base64 data URL)
- `{{ customerName }}` - Customer name

## Step 6: Add QR Code to Email
1. In email editor, add **Image** block
2. Image source: `{{ qrCodeUrl }}`
3. Width: 300px
4. Alt text: "Ticket QR Code"

**Note:** `qrCodeUrl` is a base64 data URL, works directly in `<img src="{{ qrCodeUrl }}">`

## Step 7: Apply Transactional Status
1. In email step settings, find **"Email Type"** or **"Transactional"**
2. Click **"Apply for Transactional Status"**
3. Fill form:
   - Type: Transactional
   - Reason: "Order/ticket confirmation"
   - Frequency: Per transaction
4. Submit (approval takes ~24 hours)
5. **Important:** Transactional emails bypass unsubscribe lists

## Step 8: Test
1. Click **"Send Test"** in Flow builder
2. Enter test email
3. Verify:
   - Email received
   - All properties display
   - QR code shows
   - Formatting correct

## Step 9: Activate
1. Click **"Activate"** or **"Publish"**
2. Flow is now live

## Verification
- [ ] Flow created and activated
- [ ] Trigger: "Ticket Purchased" event
- [ ] Email includes QR code
- [ ] Transactional status applied
- [ ] Test email received successfully

## Troubleshooting
**Event not appearing:** Check Vercel logs, verify `KLAVIYO_PRIVATE_KEY` is set
**Email not sending:** Verify Flow is activated, check trigger matches event name exactly
**QR code not showing:** Verify `qrCodeUrl` property in email template, check image tag syntax

