# How to Get Your Supabase PostgreSQL Connection String

## You Need the PostgreSQL Connection String (Not the URL)

The `SUPABASE_URL` you provided is for the REST API. We need the **PostgreSQL connection string** for direct database access.

## Steps to Get Connection String:

1. **Go to Supabase Dashboard** → Your Project
2. **Click Settings** (gear icon) → **Database**
3. **Scroll down to "Connection string"** section
4. **Find "URI"** (not "Session mode" or "Transaction mode")
5. **Copy the connection string** - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.hdeymsqvxdogkydwvlwh.supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with your actual database password
   - This is the password you set when creating the Supabase project
   - If you forgot it, you can reset it in Settings → Database → Database password

## Your Connection String Should Look Like:

```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hdeymsqvxdogkydwvlwh.supabase.co:5432/postgres
```

## Add to Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: (paste the full connection string with password)
   - **Environments**: Select all (Production, Preview, Development)
3. **Save**

## Important Notes:

- The connection string includes your password - keep it secret
- Don't use `SUPABASE_URL` or `SUPABASE_ANON_KEY` - we need `DATABASE_URL`
- The connection string format is: `postgresql://user:password@host:port/database`
- Your host should be: `db.hdeymsqvxdogkydwvlwh.supabase.co`

## Can't Find the Connection String?

If you don't see it:
1. Make sure you're in **Settings** → **Database** (not API)
2. Look for "Connection string" or "Connection pooling" section
3. The "URI" option is what you need
4. It should show: `postgresql://postgres:[YOUR-PASSWORD]@...`

Once you have the connection string, add it to Vercel as `DATABASE_URL` and redeploy!








