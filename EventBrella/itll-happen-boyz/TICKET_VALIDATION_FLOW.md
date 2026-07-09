# Ticket Validation Flow - Troubleshooting Guide

## The Flow

1. **Purchase** → Customer buys ticket via Stripe
2. **Webhook** → `stripe-webhook.js` receives `checkout.session.completed` event
3. **QR Code Generation** → Creates ticket ID: `TKT_{transactionId}_{ticketNumber}`
4. **Database Creation** → Creates ticket record in PostgreSQL
5. **Email Sent** → Klaviyo sends email with QR code
6. **QR Code Scan** → Camera scans QR code → Opens `/api/validate-ticket?ticketId=...`
7. **Database Lookup** → `validate-ticket.js` queries PostgreSQL for ticket
8. **Display/Check-in** → Shows ticket details or allows check-in

## Why "Ticket Not Found" Error Occurs

### Issue 1: Database Not Connected
**Symptom:** "Ticket Not Found" for all tickets
**Cause:** `DATABASE_URL` environment variable not set in Vercel
**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `DATABASE_URL=postgresql://user:password@host:port/database`
3. Redeploy

### Issue 2: Tickets Not Created
**Symptom:** "Ticket Not Found" for newly purchased tickets
**Cause:** Webhook failed to create ticket records
**Check:**
1. Go to Vercel Dashboard → Functions → `stripe-webhook`
2. Check logs for errors like:
   - `❌ Error creating tickets in database`
   - `⚠️ No ticket data from QR code generation`
3. Look for: `✅ All X ticket(s) created in database` (should see this)

### Issue 3: Database Connection Error
**Symptom:** Database error page shown
**Cause:** PostgreSQL connection string incorrect or database unreachable
**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check database allows connections from Vercel IPs
3. For local testing, ensure database is accessible

### Issue 4: Ticket ID Mismatch
**Symptom:** "Ticket Not Found" but ticket exists
**Cause:** Ticket ID in QR code doesn't match database
**Check:**
1. Scan QR code and note the `ticketId` in the URL
2. Check Vercel logs for: `🔍 Querying database for ticket: TKT_xxx_1`
3. Verify ticket exists in database with that exact ID

## Debugging Steps

### Step 1: Check Database Connection
```bash
# In Vercel function logs, look for:
✅ PostgreSQL connection pool created
✅ Database tables initialized
```

### Step 2: Check Ticket Creation
```bash
# In webhook logs after purchase, look for:
✅ Ticket 1 of 1 created in database: TKT_cs_test_xxx_1
✅ All 1 ticket(s) created in database
```

### Step 3: Check Ticket Lookup
```bash
# In validate-ticket logs when scanning, look for:
🔍 Looking up ticket in database: { ticketId: 'TKT_xxx_1', ... }
🔍 Querying database for ticket: TKT_xxx_1
📊 Database query result: { ticketId: 'TKT_xxx_1', rowCount: 1, found: true }
```

### Step 4: Check Database Tables
If you have database access, run:
```sql
SELECT * FROM tickets WHERE ticket_id = 'TKT_xxx_1';
```

## Common Fixes

### Fix 1: Set DATABASE_URL
1. Get PostgreSQL connection string
2. Add to Vercel environment variables
3. Redeploy

### Fix 2: Recreate Tickets
If tickets weren't created:
1. Check webhook logs for errors
2. Fix database connection
3. Test with new purchase (old tickets won't work)

### Fix 3: Check QR Code URL
The QR code should contain:
```
https://farmerbanks.eventbrella.us/api/validate-ticket?ticketId=TKT_xxx_1&transactionId=xxx&...
```

If it's different, check `BASE_URL` environment variable.

## Testing

1. **Make a test purchase**
2. **Check Vercel logs** for:
   - `✅ All X ticket(s) created in database`
3. **Scan QR code** from email
4. **Check Vercel logs** for:
   - `🔍 Looking up ticket in database`
   - `📊 Database query result: { found: true }`
5. **Should see ticket details page**

## Next Steps

If still not working:
1. Check Vercel function logs for specific errors
2. Verify `DATABASE_URL` is set correctly
3. Test database connection manually
4. Check if tickets table exists and has data








