# Supabase Setup Instructions

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. Find **"URI"** (not "Session mode" or "Transaction mode")
5. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
6. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project)

## Step 2: Create the Tickets Table

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: `Success. No rows returned`

## Step 3: Verify Table Was Created

Run this query in SQL Editor:
```sql
SELECT * FROM tickets LIMIT 1;
```

Should return: `0 rows` (table exists but is empty - that's correct!)

## Step 4: Add Connection String to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: (paste your Supabase connection string with password)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**

## Step 5: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click **"..."** on latest deployment → **"Redeploy"**
   OR
3. Push a new commit to trigger auto-deploy

## Step 6: Test

1. Make a test ticket purchase
2. Check Vercel function logs - should see:
   - `✅ PostgreSQL connection pool created`
   - `✅ Database tables initialized`
   - `✅ All X ticket(s) created in database`
3. Scan the QR code - should work now!

## Troubleshooting

### "relation tickets does not exist"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that you're in the correct project/database

### "password authentication failed"
- Verify your connection string has the correct password
- Check Supabase Settings → Database → Connection string

### "connection refused"
- Make sure your Supabase project is active (not paused)
- Check that connection string is correct

## Viewing Tickets in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Click on **"tickets"** table
3. You'll see all ticket records with all columns

## Connection String Format

Your connection string should look like:
```
postgresql://postgres:YOUR_PASSWORD_HERE@db.xxxxx.supabase.co:5432/postgres
```

**Important**: 
- Replace `YOUR_PASSWORD_HERE` with your actual database password
- Don't include brackets `[]` in the connection string
- The password is the one you set when creating the Supabase project (not your Supabase account password)








