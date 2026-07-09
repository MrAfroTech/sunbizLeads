# PostgreSQL Setup for Ticket Tracking

## Overview
The ticket system now uses PostgreSQL to track all ticket purchases and check-ins. Each ticket purchase creates a database record, and check-ins are permanently stored.

## Database Configuration

### Environment Variables Required

Add these to your Vercel environment variables:

**Option 1: Connection String (Recommended)**
```
DATABASE_URL=postgresql://user:password@host:port/database
```

**Option 2: Individual Parameters**
```
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=farmerbanks
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=true
```

## Database Schema

The system automatically creates the `tickets` table with the following structure:

- `id` - Auto-incrementing primary key
- `ticket_id` - Unique ticket identifier (TKT_xxx_1, TKT_xxx_2, etc.)
- `transaction_id` - Stripe transaction ID
- `event_name` - Event name (e.g., "Monthly Farm Tour")
- `event_date` - Event date
- `event_time` - Event time
- `event_venue` - Event venue
- `customer_name` - Customer name
- `customer_email` - Customer email
- `customer_phone` - Customer phone (optional)
- `ticket_count` - Total tickets in purchase
- `ticket_number` - This ticket's number (1, 2, 3...)
- `tier` - Ticket tier (basic, etc.)
- `purchase_date` - When ticket was purchased
- `qr_code_url` - QR code image URL
- `checksum` - Security checksum
- `redeemed` - Boolean, whether ticket is checked in
- `redeemed_at` - Timestamp when checked in
- `redeemed_by` - Who checked in the ticket
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

## How It Works

1. **Ticket Purchase**: When a payment is completed via Stripe webhook:
   - QR code is generated for each ticket
   - Database record is created for EACH ticket (if someone buys 3 tickets, 3 records are created)
   - Each ticket has a unique `ticket_id` (TKT_TXN123_1, TKT_TXN123_2, TKT_TXN123_3)

2. **Ticket Validation**: When QR code is scanned:
   - System looks up ticket in database by `ticket_id`
   - Shows ticket details and redemption status
   - Allows check-in if not already redeemed

3. **Check-In**: When vendor clicks "Check In Ticket":
   - Updates database record: `redeemed = true`, `redeemed_at = NOW()`, `redeemed_by = 'Staff'`
   - Permanently stores who showed up and when

## Database Providers

### Recommended: Vercel Postgres
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy the connection string
4. Add as `DATABASE_URL` environment variable

### Alternative: Supabase
1. Create account at supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add as `DATABASE_URL` environment variable

### Alternative: Railway, Neon, or Any PostgreSQL Provider
- Any PostgreSQL 12+ database works
- Use connection string format: `postgresql://user:password@host:port/database`

## Testing

After setting up the database:

1. Make a test purchase
2. Check Vercel function logs - you should see:
   - "✅ Ticket 1 of X created in database"
   - "✅ All X ticket(s) created in database"
3. Scan the QR code - should show ticket details
4. Check in the ticket - should update database
5. Scan again - should show "Already Checked In"

## Troubleshooting

**Error: "relation tickets does not exist"**
- The table is created automatically on first request
- Check database connection string is correct
- Check database user has CREATE TABLE permissions

**Error: "connection refused"**
- Check database host/port is correct
- Check database allows connections from Vercel IPs
- For local testing, ensure database is accessible

**Tickets not being created**
- Check Vercel function logs for errors
- Verify `DATABASE_URL` environment variable is set
- Check database connection is working

## Next Steps

1. Set up PostgreSQL database (Vercel Postgres recommended)
2. Add `DATABASE_URL` to Vercel environment variables
3. Deploy the updated code
4. Test with a purchase - tickets should be created in database
5. Test check-in - should persist across function restarts








