# Database Setup Instructions

## You Need to Create a PostgreSQL Database Account

I did NOT create a database for you. You need to sign up for one of these services:

## Option 1: Vercel Postgres (Easiest - Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (farmerBanks)
3. **Click "Storage" tab** (in the top menu)
4. **Click "Create Database"** → Select **"Postgres"**
5. **Copy the connection string** (it will look like: `postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb`)
6. **Add to Vercel Environment Variables**:
   - Go to Settings → Environment Variables
   - Add: `DATABASE_URL` = (paste connection string)
   - Select all environments (Production, Preview, Development)
   - Save
7. **Redeploy** your project

**Cost**: Free tier available, then pay-as-you-go

---

## Option 2: Supabase (Free Tier Available)

1. **Go to**: https://supabase.com
2. **Sign up** (free account)
3. **Create new project**:
   - Project name: `farmerbanks` (or whatever you want)
   - Database password: (save this!)
   - Region: Choose closest to you
4. **Wait for project to finish setting up** (~2 minutes)
5. **Get connection string**:
   - Go to Settings → Database
   - Find "Connection string" section
   - Copy the "URI" (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
   - Replace `[YOUR-PASSWORD]` with your actual password
6. **Add to Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `DATABASE_URL` = (paste connection string with password)
   - Select all environments
   - Save
7. **Redeploy** your project

**Cost**: Free tier (500MB database, unlimited API requests)

---

## Option 3: Railway (Simple)

1. **Go to**: https://railway.app
2. **Sign up** (GitHub login)
3. **Create new project** → "New" → "Database" → "PostgreSQL"
4. **Click on the PostgreSQL service** → "Connect" tab
5. **Copy the connection string** (Postgres URL)
6. **Add to Vercel Environment Variables** (same as above)
7. **Redeploy**

**Cost**: $5/month for hobby plan, or pay-as-you-go

---

## Option 4: Neon (Serverless Postgres)

1. **Go to**: https://neon.tech
2. **Sign up** (free tier available)
3. **Create project**
4. **Copy connection string** from dashboard
5. **Add to Vercel Environment Variables** (same as above)
6. **Redeploy**

**Cost**: Free tier available

---

## After Setting Up Database

Once you've added `DATABASE_URL` to Vercel:

1. **Redeploy** your project (Vercel will automatically use the new env var)
2. **Make a test purchase** - tickets should be created in database
3. **Check Vercel logs** - you should see:
   - `✅ PostgreSQL connection pool created`
   - `✅ Database tables initialized`
   - `✅ All X ticket(s) created in database`
4. **Scan QR code** - should now work!

---

## For Local Development (Optional)

If you want to test locally, create a `.env` file in the `farmerBanks` folder:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/farmerbanks
```

**Note**: `.env` files are gitignored and won't be deployed. For production, use Vercel Environment Variables.

---

## Which Should You Choose?

- **Vercel Postgres**: Best if you're already using Vercel (easiest setup)
- **Supabase**: Best free tier, good for getting started
- **Railway**: Simple, reliable, $5/month
- **Neon**: Serverless, good for scaling

**Recommendation**: Start with **Vercel Postgres** (easiest) or **Supabase** (best free tier).








