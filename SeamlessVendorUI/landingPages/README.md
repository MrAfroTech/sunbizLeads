# Landing pages (tier assets, event playbook)

Static HTML pages that capture leads and submit to **`/api/submit-lead`**, then deliver the asset (PDF or tracker).

## How the API is resolved

- Each page uses: **`(window.API_BASE_URL || window.location.origin) + '/api/submit-lead'`**.
- So when the page is served from your Vercel app (e.g. `https://your-app.vercel.app/...`), the form posts to `https://your-app.vercel.app/api/submit-lead`.
- To point at a different backend (e.g. for static-only hosting), set **`window.API_BASE_URL`** before the form script runs (e.g. `window.API_BASE_URL = 'https://api.example.com'`).

## Vercel setup (fix 404 on `/api/submit-lead`)

1. **Root Directory**  
   In Vercel → Project → **Settings → General → Root Directory**, set to **`SeamlessVendorUI`** (the folder that contains `src/api/`, `vercel.json`, `package.json`). Redeploy after changing.

2. **Environment variables**  
   In **Settings → Environment Variables**, set for Production (and Preview if needed):
   - `BREVO_API_KEY`
   - `BREVO_LIST_ID` (e.g. `11`)
   - `BREVO_TEMPLATE_ID` (e.g. `13`)

The handler that runs at `/api/submit-lead` is **`src/api/submit-lead.js`** (see project root **VERCEL_API_SETUP.md** for full details).

## Serving these pages on Vercel

These files live under `landingPages/` and are **not** part of the CRA `build/` output. To have them live at e.g. `/tier1-revenue-rescue/` on the same app you need to either:

- Copy `landingPages/` into `build/` in a postbuild step and add rewrites in `vercel.json`, or  
- Host the HTML on a path that your SPA or static config serves from the same origin as the API.

Until then, they can be deployed as a separate static site or used from a path you configure.
