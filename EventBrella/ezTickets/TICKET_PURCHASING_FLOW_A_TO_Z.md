# Ticket Purchasing Flow - Complete A to Z Breakdown

## Overview
This codebase implements a **Stripe Checkout Sessions** payment flow with **webhook-based post-payment automation**. The system handles event selection, payment processing, QR code generation, Klaviyo integration, and email delivery.

---

## 🎯 User Journey (Frontend Flow)

### Step 1: Event Selection (`/allevents`)
**File:** `public/allevents.html` + `public/js/allevents.js`

1. User lands on `/allevents` page
2. Page displays 4 event cards:
   - **Monthly Harvest Experience** (with dropdown for 12 monthly dates)
   - **Cassava Harvest** (January 3, 2026)
   - **Yuca Harvest** (March 3, 2026)
   - **Mulberry Harvest** (April 3, 2026)

3. User selects an event:
   - For monthly events: User selects date from dropdown, then clicks "Get Tickets"
   - For special events: User clicks "Get Tickets" directly

4. JavaScript (`allevents.js`) captures:
   - `eventDate` (YYYY-MM-DD format)
   - `eventName` (optional, e.g., "Cassava Harvest")

5. Redirect to payment page:
   ```javascript
   window.location.href = `/payment.html?eventDate=2026-01-03&eventName=Cassava Harvest`;
   ```

---

### Step 2: Payment Form (`/payment.html`)
**File:** `public/payment.html` + `public/js/payment.js`

1. Page loads and reads URL parameters:
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const eventDate = urlParams.get('eventDate');
   const eventName = urlParams.get('eventName');
   ```

2. Form displays:
   - Event date (formatted: "Saturday, January 3, 2026")
   - Event name
   - Customer name field
   - Customer email field
   - Customer phone field (optional)
   - Ticket count selector (1-10 tickets)
   - Total price calculation ($10.00 per ticket)

3. User fills out form and clicks "Purchase Tickets"

4. Form submission handler (`handlePayment` function):
   ```javascript
   // Collects form data
   const customerName = document.getElementById('customerName').value;
   const customerEmail = document.getElementById('customerEmail').value;
   const ticketCount = parseInt(document.getElementById('ticketCount').value);
   
   // Sends POST request to /api/stripe-payment
   const response = await fetch('/api/stripe-payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       tier: 'basic',
       eventDate: eventDate,
       customerEmail: customerEmail,
       customerName: customerName,
       ticketCount: ticketCount
     })
   });
   ```

---

## 💳 Payment Processing (Backend API)

### Step 3: Create Stripe Checkout Session
**File:** `api/stripe-payment.js`

1. **Endpoint:** `POST /api/stripe-payment`

2. **Request Validation:**
   - Checks for required fields: `tier`, `eventDate`, `customerEmail`, `customerName`
   - Validates tier (currently only `'basic'` supported)
   - Gets price from environment: `TIER_BASIC_PRICE` (default: $10.00 = 1000 cents)

3. **Transaction ID Generation:**
   ```javascript
   const transactionId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
   // Example: TXN_A1B2C3D4E5F6
   ```

4. **Stripe Checkout Session Creation:**
   ```javascript
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [{
       price_data: {
         currency: 'usd',
         product_data: {
           name: 'Cassava Harvest Ticket',
           description: `Farmer Banks Harvest Experience - ${eventDate}`
         },
         unit_amount: 1000 // $10.00 in cents
       },
       quantity: ticketCount
     }],
     mode: 'payment',
     customer_email: customerEmail,
     success_url: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: BASE_URL,
     metadata: {
       transaction_id: transactionId,
       tier: 'basic',
       event_date: eventDate,
       customer_name: customerName,
       ticket_count: ticketCount.toString(),
       event_name: 'Cassava Harvest',
       event_time: '8:00 AM - 10:00 AM EST',
       event_venue: 'Here On The Farm',
       organizer_name: 'Farmer Banks Helfrich'
     }
   });
   ```

5. **Response:**
   ```json
   {
     "success": true,
     "sessionUrl": "https://checkout.stripe.com/pay/cs_test_...",
     "transactionId": "TXN_A1B2C3D4E5F6",
     "sessionId": "cs_test_..."
   }
   ```

---

### Step 4: Stripe Checkout Redirect
**Frontend:** `public/js/payment.js`

1. Frontend receives `sessionUrl` from API response
2. Redirects user to Stripe Checkout:
   ```javascript
   window.location.href = paymentData.sessionUrl;
   ```

3. User completes payment on Stripe's hosted checkout page
4. Stripe processes payment (card validation, 3D Secure if needed, etc.)

---

### Step 5: Payment Success Redirect
**File:** `public/success.html`

1. After successful payment, Stripe redirects to:
   ```
   /success.html?session_id=cs_test_...
   ```

2. Success page displays:
   - ✅ Success message
   - "Your tickets have been purchased successfully"
   - "Check your email for your ticket confirmation with QR codes"
   - Link back to event page

**Note:** The success page is just a confirmation UI. The actual ticket generation happens via webhook (see below).

---

## 🔔 Webhook Processing (Post-Payment Automation)

### Step 6: Stripe Webhook Event
**File:** `api/stripe-webhook.js`

1. **Stripe sends webhook** to: `https://your-domain.com/api/stripe-webhook`
   - Event type: `checkout.session.completed`
   - Contains full session object with all metadata

2. **Webhook Configuration:**
   - **Test Mode:** Uses `STRIPE_WEBHOOK_TEST_SECRET`
   - **Live Mode:** Uses `STRIPE_WEBHOOK_LIVE_SECRET`
   - Determined by `TEST_MODE` environment variable

3. **Signature Verification:**
   ```javascript
   // Read raw body (CRITICAL: must be raw bytes for signature verification)
   const chunks = [];
   for await (const chunk of req) {
     chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
   }
   const rawBody = Buffer.concat(chunks);
   
   // Verify signature
   const event = stripe.webhooks.constructEvent(
     rawBody, 
     req.headers['stripe-signature'], 
     STRIPE_WEBHOOK_SECRET
   );
   ```

4. **Vercel Configuration:**
   - `vercel.json` disables body parsing for webhook:
   ```json
   {
     "functions": {
       "api/**/*.js": {
         "bodyParser": false  // Handled in code
       }
     }
   }
   ```

---

### Step 7: Process Checkout Completion
**File:** `api/stripe-webhook.js` → `handleCheckoutCompleted()`

1. **Extract Metadata:**
   ```javascript
   const metadata = session.metadata;
   const transactionId = metadata.transaction_id;
   const eventDate = metadata.event_date;
   const customerName = metadata.customer_name;
   const ticketCount = parseInt(metadata.ticket_count);
   const customerEmail = session.customer_email;
   const amountTotal = session.amount_total; // in cents
   ```

2. **Generate Event Slug:**
   ```javascript
   // Format: eventname_YYYY_MM_DD
   const eventSlug = `${eventName.toLowerCase().replace(/\s+/g, '_')}_${eventDate.replace(/-/g, '_')}`;
   // Example: "cassava_harvest_2026_01_03"
   ```

3. **Post-Payment Flow (3 steps, in sequence):**

---

### Step 8: Generate QR Code
**File:** `api/stripe-webhook.js` → `generateQRCode()`

1. **QR Code Content:**
   - Contains: `transactionId` (e.g., "TXN_A1B2C3D4E5F6")
   - Format: Base64 data URL
   - Size: 300x300 pixels

2. **Implementation:**
   ```javascript
   const QRCode = require('qrcode');
   const qrCodeUrl = await QRCode.toDataURL(transactionId, {
     width: 300,
     margin: 2
   });
   // Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
   ```

3. **QR Code is used in:**
   - Klaviyo event payload (sent to customer email)
   - Ticket confirmation email

---

### Step 9: Send Event to Klaviyo
**File:** `api/stripe-webhook.js` → `syncToKlaviyo()`

1. **Purpose:** Trigger Klaviyo Flow for automated email delivery

2. **Klaviyo API Details:**
   - **Endpoint:** `https://a.klaviyo.com/api/events`
   - **Method:** `POST`
   - **Headers:**
     ```javascript
     {
       'Content-Type': 'application/json',
       'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
       'Revision': '2024-07-15'
     }
     ```

3. **Event Payload Structure (JSON:API format):**
   ```json
   {
     "data": {
       "type": "event",
       "attributes": {
         "metric": {
           "data": {
             "type": "metric",
             "attributes": {
               "name": "Ticket Purchased"
             }
           }
         },
         "profile": {
           "data": {
             "type": "profile",
             "attributes": {
               "email": "customer@example.com",
               "first_name": "John",
               "last_name": "Doe"
             }
           }
         },
         "properties": {
           "eventSlug": "cassava_harvest_2026_01_03",
           "eventName": "Cassava Harvest",
           "eventDate": "2026-01-03",
           "eventTime": "8:00 AM - 10:00 AM EST",
           "eventVenue": "Here On The Farm",
           "organizerName": "Farmer Banks Helfrich",
           "transactionId": "TXN_A1B2C3D4E5F6",
           "ticketCount": 2,
           "ticketNumber": 1,
           "tier": "basic",
           "amount": 20.00,
           "qrCodeUrl": "data:image/png;base64,...",
           "purchaseDate": "2025-01-15T10:30:00.000Z",
           "customerName": "John Doe"
         },
         "value": 20.00,
         "time": "2025-01-15T10:30:00.000Z"
       }
     }
   }
   ```

4. **Key Properties:**
   - `eventSlug`: Used by Klaviyo to filter which Flow to trigger
   - `qrCodeUrl`: Base64 QR code image embedded in email
   - `ticketNumber`: For multi-ticket purchases (e.g., "Ticket 1 of 2")
   - `value`: Numeric amount (required by Klaviyo)

5. **Klaviyo Flow Setup:**
   - Create Flow in Klaviyo Dashboard
   - Trigger: Metric = "Ticket Purchased"
   - Filter: `eventSlug equals "cassava_harvest_2026_01_03"`
   - Email template uses Klaviyo variables: `{{ event.event_name }}`, `{{ event.qr_code_url }}`, etc.

---

### Step 10: Email Delivery (via Klaviyo)
**Klaviyo Flow (configured in Klaviyo Dashboard)**

1. Klaviyo receives `Ticket Purchased` event
2. Flow filter matches `eventSlug`
3. Klaviyo sends transactional email to customer
4. Email contains:
   - Event details (name, date, time, venue)
   - QR code image (`<img src="{{ event.qr_code_url }}">`)
   - Transaction ID
   - Ticket number (e.g., "Ticket 1 of 2")
   - Organizer information

**Note:** Email template is configured in Klaviyo Dashboard, not in codebase.

---

## 📁 File Structure

```
EventBrella/farmerBanks/
├── api/
│   ├── stripe-payment.js      # Creates Stripe Checkout Session
│   └── stripe-webhook.js      # Handles post-payment automation
├── public/
│   ├── allevents.html         # Event selection page
│   ├── payment.html            # Payment form page
│   ├── success.html            # Payment success page
│   ├── js/
│   │   ├── allevents.js        # Event selection logic
│   │   └── payment.js          # Payment form logic
│   └── styles/
│       └── main.css            # Shared styles
├── vercel.json                 # Vercel deployment config
└── package.json               # Dependencies
```

---

## 🔐 Environment Variables

### Required Variables:

```bash
# Stripe (Test Mode)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_TEST_SECRET=whsec_...
TEST_MODE=true

# Stripe (Live Mode)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_LIVE_SECRET=whsec_...
TEST_MODE=false

# Klaviyo
KLAVIYO_PRIVATE_KEY=pk_...

# Pricing
TIER_BASIC_PRICE=1000  # $10.00 in cents

# Base URL
BASE_URL=https://your-domain.com
```

---

## 🔄 Complete Flow Diagram

```
1. User visits /allevents
   ↓
2. User selects event → Redirects to /payment.html?eventDate=...
   ↓
3. User fills payment form → Submits to /api/stripe-payment
   ↓
4. Backend creates Stripe Checkout Session → Returns sessionUrl
   ↓
5. Frontend redirects to Stripe Checkout (sessionUrl)
   ↓
6. User completes payment on Stripe
   ↓
7. Stripe redirects to /success.html?session_id=...
   ↓
8. Stripe sends webhook to /api/stripe-webhook (checkout.session.completed)
   ↓
9. Webhook handler:
   a. Verifies signature
   b. Extracts metadata
   c. Generates QR code
   d. Sends event to Klaviyo
   ↓
10. Klaviyo Flow triggers → Sends email with ticket + QR code
   ↓
11. Customer receives email with ticket confirmation
```

---

## 🛠️ Key Technical Details

### 1. **Stripe Checkout Sessions (Redirect Flow)**
- **Why:** Simpler than PaymentIntent, no PCI compliance needed
- **Flow:** User redirected to Stripe-hosted page, then redirected back
- **Metadata:** All event/customer data stored in `session.metadata`

### 2. **Webhook Signature Verification**
- **Critical:** Must read raw request body (Buffer) for signature verification
- **Vercel:** Disable `bodyParser` in `vercel.json` for webhook route
- **Implementation:** Read from request stream as Buffer, pass directly to `stripe.webhooks.constructEvent()`

### 3. **Klaviyo Integration**
- **API Version:** REST API v2024-07-15
- **Format:** JSON:API (relationships with `data`, `type`, `attributes`)
- **Event Slug:** Used for Flow filtering (allows multiple events with same metric)
- **QR Code:** Base64 data URL embedded in event payload

### 4. **Error Handling**
- **Webhook:** Always returns 200 to Stripe (prevents retries)
- **Helper Functions:** Failures logged but don't stop webhook response
- **Frontend:** Shows error messages, doesn't redirect on failure

### 5. **Test Mode**
- **Stripe:** Uses test keys and test webhook secret
- **Payment:** Returns mock session URL in test mode
- **Webhook:** Uses `STRIPE_WEBHOOK_TEST_SECRET` when `TEST_MODE=true`

---

## 🎯 Key Functions Reference

### Frontend (`payment.js`)
- `handlePayment()`: Submits form, creates checkout session, redirects
- `updateEventDateDisplay()`: Updates UI with selected event date
- `updateTotal()`: Calculates total price based on ticket count

### Backend (`stripe-payment.js`)
- `module.exports`: Main handler, creates Stripe Checkout Session

### Webhook (`stripe-webhook.js`)
- `module.exports`: Main webhook handler, verifies signature, routes events
- `handleCheckoutCompleted()`: Orchestrates post-payment flow
- `generateQRCode()`: Creates QR code as Base64 data URL
- `syncToKlaviyo()`: Sends event to Klaviyo API

---

## 📝 Notes for ChatGPT

1. **No PaymentIntent:** This codebase uses Checkout Sessions, not PaymentIntent
2. **No Card Elements:** Frontend doesn't handle card input (Stripe Checkout handles it)
3. **Webhook-Driven:** All post-payment automation happens via webhook, not frontend
4. **Klaviyo Handles Email:** Email templates are in Klaviyo Dashboard, not codebase
5. **Event Slug System:** Each event has unique slug for Klaviyo Flow filtering
6. **Multi-Ticket Support:** System handles 1-10 tickets per purchase
7. **Test/Live Mode:** Determined by `TEST_MODE` env var and secret key presence

---

## 🚀 Deployment

1. **Vercel Configuration:**
   - `vercel.json` defines routes and function settings
   - `includeFiles: "node_modules/**"` ensures dependencies are bundled
   - `bodyParser: false` for webhook route (handled in code)

2. **Stripe Webhook Setup:**
   - Create webhook endpoint in Stripe Dashboard
   - Point to: `https://your-domain.com/api/stripe-webhook`
   - Subscribe to: `checkout.session.completed`
   - Copy webhook signing secret to Vercel env vars

3. **Klaviyo Setup:**
   - Create "Ticket Purchased" metric in Klaviyo
   - Create Flow with filter: `eventSlug equals "your_event_slug"`
   - Design email template using Klaviyo variables
   - Apply for transactional approval (for instant delivery)

---

## ✅ Testing Checklist

- [ ] Event selection redirects to payment page with correct date
- [ ] Payment form displays correct event date
- [ ] Stripe Checkout Session created successfully
- [ ] User can complete payment on Stripe
- [ ] Success page displays after payment
- [ ] Webhook receives `checkout.session.completed` event
- [ ] QR code generates successfully
- [ ] Klaviyo event sent with correct payload
- [ ] Customer receives email with ticket and QR code

---

**End of A-to-Z Breakdown**









