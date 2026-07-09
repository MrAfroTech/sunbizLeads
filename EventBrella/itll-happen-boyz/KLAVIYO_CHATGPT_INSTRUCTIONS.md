# Klaviyo Setup Instructions for ChatGPT

**Purpose:** Guide ChatGPT to help set up Klaviyo Flow and Event for Farmer Banks ticket system.

**Context:** Backend sends "Ticket Purchased" events to Klaviyo with `eventSlug` property for flow filtering.

---

## Instructions for ChatGPT

You are helping set up a Klaviyo Flow for ticket confirmation emails. Follow these exact steps:

### Step 1: Verify Event Exists
1. Ask user to make a test purchase on their site
2. Have them check Klaviyo Dashboard → **Metrics** → Look for "Ticket Purchased" event
3. If event doesn't exist, it will be created automatically when first sent
4. Verify the event includes `eventSlug` property

### Step 2: Create Master Flow
1. Navigate to: **Klaviyo Dashboard** → **Flows** → **Create Flow**
2. Name the flow: `Event Ticket Confirmation – MASTER`
3. Select: **Event-triggered** or **Start from scratch**

### Step 3: Set Event Trigger
1. Click **"Start"** or **"Add Trigger"**
2. Select **"Event"** as trigger type
3. Choose metric: **"Ticket Purchased"**
4. Add **Flow Filter:**
   - Property: `eventSlug`
   - Condition: `equals`
   - Value: `cassava_harvest_2026_01_03`
   - *(Note: This will be changed when cloning flows for other events)*

### Step 4: Add Email Step
1. Click **"Add Step"** → **"Send Email"**
2. Click the email step to edit it

### Step 5: Configure Email Settings
**Basic Settings:**
- **Subject line:** `Your {{ eventName }} Tickets - {{ eventDate }}`
- **From name:** "Farmer Banks"
- **From email:** [User's verified sender email]

### Step 6: Build Email Content
**Available Properties to Use:**
- `{{ eventSlug }}` - Event identifier for filtering
- `{{ eventName }}` - Event name (e.g., "Cassava Harvest")
- `{{ eventDate }}` - Event date (e.g., "2026-01-03")
- `{{ eventTime }}` - Event time (e.g., "8:00 AM - 10:00 AM EST")
- `{{ eventVenue }}` - Venue (e.g., "Here On The Farm")
- `{{ organizerName }}` - Organizer (e.g., "Farmer Banks Helfrich")
- `{{ transactionId }}` - Transaction ID
- `{{ ticketCount }}` - Number of tickets purchased
- `{{ ticketNumber }}` - Ticket number (1, 2, 3...)
- `{{ tier }}` - Ticket tier (basic, premium, etc.)
- `{{ amount }}` - Amount paid
- `{{ qrCodeUrl }}` - QR code image (base64 data URL)
- `{{ purchaseDate }}` - Purchase date/time
- `{{ customerName }}` - Customer name

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

[QR CODE IMAGE HERE - Use {{ qrCodeUrl }}]

Your ticket QR code is above. Please present this at the event entrance.

Questions? Contact {{ organizerName }}.

See you at the farm!
```

### Step 7: Add QR Code Image
1. In the email editor, add an **Image** block
2. For image source, use: `{{ qrCodeUrl }}`
3. Set image width: **300px**
4. Add alt text: "Ticket QR Code"
5. **Important:** `qrCodeUrl` is a base64 data URL, so it works directly in an `<img>` tag:
   ```html
   <img src="{{ qrCodeUrl }}" width="300" alt="Ticket QR Code">
   ```

### Step 8: Apply Transactional Status
1. In the email step settings, find **"Email Type"** or **"Transactional"** option
2. Click **"Apply for Transactional Status"**
3. Fill out the form:
   - **Email type:** Transactional
   - **Reason:** "Order/ticket confirmation email"
   - **Frequency:** Per transaction
4. Submit the form (approval typically takes ~24 hours)
5. **Note:** Transactional emails bypass unsubscribe lists, ensuring customers always receive ticket confirmations

### Step 9: Test the Flow
1. Click **"Send Test"** in the Flow builder
2. Enter a test email address
3. Verify the test email:
   - ✅ Email is received
   - ✅ All properties display correctly (eventName, eventDate, etc.)
   - ✅ QR code image displays
   - ✅ Formatting looks good
   - ✅ `eventSlug` property is present in event data

### Step 10: Activate the Flow
1. Click **"Activate"** or **"Publish"** button
2. Flow is now live and will trigger when "Ticket Purchased" events are sent with matching `eventSlug`

### Step 11: Clone Flow for Additional Events
**For each new event:**
1. **Duplicate** the master flow
2. **Rename** to: `Event Ticket Confirmation – [Event Name] [Date]`
   - Example: `Event Ticket Confirmation – Goat Yoga Feb 2026`
3. **Edit Flow Filter:**
   - Change the `eventSlug` value to match the new event
   - Example: Change from `cassava_harvest_2026_01_03` to `goat_yoga_2026_02_12`
4. **Activate** the cloned flow
5. **Done** - No template edits needed, just the filter change

---

## Key Points to Emphasize

1. **Event Name:** "Ticket Purchased" (exact string, case-sensitive)
2. **Flow Filter:** Must use `eventSlug` property with `equals` condition
3. **QR Code:** Use `{{ qrCodeUrl }}` directly in `<img>` tag (it's base64)
4. **Transactional Status:** Required for ticket confirmations (bypasses unsubscribe)
5. **Cloning:** For new events, only change the `eventSlug` filter value

---

## Troubleshooting Help

**If event not appearing:**
- Check Vercel logs for webhook errors
- Verify `KLAVIYO_PRIVATE_KEY` is set in Vercel environment variables
- Check Klaviyo API key is correct

**If email not sending:**
- Verify Flow is activated
- Check Flow filter matches `eventSlug` exactly (case-sensitive)
- Verify transactional status is approved
- Check email didn't go to spam folder

**If QR code not displaying:**
- Verify `qrCodeUrl` property is in email template
- Check image tag syntax: `<img src="{{ qrCodeUrl }}" width="300">`
- Test with a direct base64 data URL

**If properties not displaying:**
- Verify property names match exactly (case-sensitive)
- Check event data in Klaviyo Metrics to see what was sent
- Use Klaviyo's preview/test feature to debug

---

## Verification Checklist

After setup, verify:
- [ ] Flow is created and activated
- [ ] Trigger is set to "Ticket Purchased" event
- [ ] Flow filter uses `eventSlug equals "cassava_harvest_2026_01_03"`
- [ ] Email template includes all ticket details
- [ ] QR code image is included and displays correctly
- [ ] Transactional status is applied for (or approved)
- [ ] Test email was received successfully
- [ ] All Klaviyo properties are displaying correctly

---

**End of Instructions for ChatGPT**

