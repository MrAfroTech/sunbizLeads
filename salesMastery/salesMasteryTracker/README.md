# Sales Mastery Tracker

React + Vite app for sales prospecting metrics. Data is stored in **Supabase**.

## Supabase setup

1. **Create the table**  
   In [Supabase](https://supabase.com/dashboard) → SQL Editor, run the migration:
   - `supabase/migrations/001_prospecting_weeks.sql`

2. **Environment variables**  
   In this directory, create a `.env` file (see `.env.example`). The `prospecting_weeks` table lives in Supabase **project id: `vtpydjccfxrwlanabpwd`**.
   - `VITE_SUPABASE_URL` — `https://vtpydjccfxrwlanabpwd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — anon key from that project (Supabase Dashboard → Project Settings → API)

   Vite only reads `.env` from this folder when you run `npm run dev` or `npm run build` here.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build

## Deploy (Vercel)

1. **Connect the repo**  
   In Vercel: New Project → Import the repo that contains this app. Set **Root Directory** to `salesMastery/salesMasteryTracker` (or the path to this folder inside your repo).

2. **Environment variables** (Vercel project → Settings → Environment Variables)  
   Add these so the build and runtime can talk to Supabase:
   - `VITE_SUPABASE_URL` = `https://vtpydjccfxrwlanabpwd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key (Supabase Dashboard → project vtpydjccfxrwlanabpwd → Settings → API → anon public)

   Apply to Production, Preview, and Development.

3. **Deploy**  
   Vercel will use `vercel.json` (build command, output `dist`, SPA rewrites). Push to trigger a deploy or deploy from the Vercel dashboard.
