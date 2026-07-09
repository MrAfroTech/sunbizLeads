# Vercel API route setup (seamless-client-site)

## Why `/api/submit-lead` was 404

1. **Root Directory** – If this repo is **SeamlessMarketplace** and the app lives in **SeamlessVendorUI**, the Vercel project must use that folder as the root, or the `api/` folder is never seen.

2. **What to set in Vercel**
   - Project: **seamless-client-site**
   - **Settings → General → Root Directory**  
     Set to: **`SeamlessVendorUI`** (or the exact folder name that contains `api/`, `src/`, `vercel.json`, `package.json`).
   - Leave blank only if the repo root already contains `api/`, `vercel.json`, and `package.json`.

3. **After changing Root Directory**
   - Trigger a new deployment (e.g. push a commit or **Redeploy** in the Vercel dashboard).
   - **`src/api/submit-lead.js`** will then be built and served at **`/api/submit-lead`**.

4. **Env vars**
   - In **Settings → Environment Variables**, set for Production (and Preview if you want):
     - `BREVO_API_KEY`
     - `BREVO_LIST_ID` (e.g. `11`)
     - `BREVO_TEMPLATE_ID` (e.g. `13`)

5. **Microsoft Teams / Outlook scheduling** (`/api/book-maurice-calendar`)
   - Required for “Schedule a Demo” → Teams meeting creation:
     - `MICROSOFT_TENANT_ID` – Azure AD tenant ID
     - `MICROSOFT_CLIENT_ID` – App (client) ID of the registered app
     - `MICROSOFT_CLIENT_SECRET` – Client secret for that app
     - `MAURICE_SANDERS_EMAIL` – Outlook/Teams user email whose calendar receives the event (and who gets the Teams link)
   - Optional (confirmation email; if missing, Graph sendMail is tried):
     - `BREVO_API_KEY` – used to send confirmation with Teams link
     - `BREVO_SENDER_EMAIL` (e.g. `team@ezdrink.us`)
     - `BREVO_SENDER_NAME` (e.g. `Seamlessly`)
   - App registration: grant **Calendars.ReadWrite** (application) on Microsoft Graph; for invite email fallback, **Mail.Send** (application).

## Current `vercel.json` behavior

- **Builds:** React app from `package.json` (output `build/`) and **`src/api/**/*.js`** as serverless functions.
- **Routes:**  
  - `/api/*` → handled by the matching file in **`src/api/`** (e.g. `/api/submit-lead` → `src/api/submit-lead.js`).  
  - Everything else → `index.html` (SPA).

So `/api/submit-lead` only works when the build runs in the directory that contains **`src/api/`** and `vercel.json`; set Root Directory to **SeamlessVendorUI**.
