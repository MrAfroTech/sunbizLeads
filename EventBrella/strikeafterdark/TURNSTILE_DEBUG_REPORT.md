# Turnstile Error 110200 – Debug Report

**Error 110200:** Invalid site key or site key doesn't match the domain.

---

## Task 1: Site key implementation

### Exact HTML (both checkout pages)

**Files:** `public/payment.html` (line 111), `platformDrivenPages/tours/payment.html` (line 111)

```html
<div class="cf-turnstile" data-sitekey="0x4AAAAAACame_Us1N8bvx4T" id="turnstileWidget"></div>
```

- **How the site key is passed:** Hardcoded in the HTML. No environment variable is used on the frontend.
- **Value rendered:** The value in the browser will be exactly `0x4AAAAAACame_Us1N8bvx4T` (same as in source; this is static HTML).

---

## Task 2: Environment variable usage

- **`CLOUDFLARE_TURNSTILE_SITE_KEY`:** Not used anywhere in this codebase.
- **`TURNSTILE_SITE_KEY`:**  
  - **Defined in:** `strikeafterdark/.env` and (one level up) `EventBrella/.env`.  
  - **Used in code:** Only in docs (`VERCEL_ENV_VARIABLES.md`). The **frontend does not read it**; the widget uses the hardcoded key above.  
  - **Backend:** `api/stripe-payment.js` uses only `process.env.TURNSTILE_SECRET_KEY` for server-side verification.
- **Build step:** No build step injects the site key. Static HTML is served as-is. Restart only matters for the API (to load `TURNSTILE_SECRET_KEY` from `.env`).

---

## Task 3: Domain configuration

From the codebase we know:

- **Production:** App is intended to run at `https://strikeafterdark.eventbrella.us` (see `vercel.json` rewrites, `getBaseUrl` in `api/stripe-payment.js`, docs).
- **Preview:** May use `https://<vercel-url>` (e.g. `*.vercel.app`).
- **Local:** Often `http://localhost:3000` or similar with `vercel dev`.

**You need to confirm in the browser when 110200 appears:**

1. Exact URL in the address bar (e.g. `https://strikeafterdark.eventbrella.us/payment.html` or `http://localhost:3000/...`).
2. Whether it’s HTTP or HTTPS.

---

## Task 4: Rendered HTML

Because the pages are static HTML (no React/Vite replacement), the served markup is the same as in the repo:

```html
<div class="cf-turnstile" data-sitekey="0x4AAAAAACame_Us1N8bvx4T" id="turnstileWidget"></div>
```

So the key is not wrapped in extra quotes, and there are no spaces or line breaks inside the attribute value.

---

## Task 5: Common issues checklist

| Check | Result |
|-------|--------|
| Site key wrapped in quotes when it shouldn’t be | No – value is `0x4AAAAAACame_Us1N8bvx4T` in double-quoted attribute. |
| Extra spaces or line breaks in site key | No – single continuous string. |
| Env var actually loaded for site key | N/A – frontend uses hardcoded key, not env. |
| Framework env syntax (React/Next/Vite) | N/A – plain HTML/JS, no build-time injection. |
| Restart after .env | Only affects backend `TURNSTILE_SECRET_KEY`; site key is hardcoded. |

---

## Task 6: Hardcoded test

The site key is **already hardcoded** in the HTML. So if you still see 110200:

- The key itself is valid in the Cloudflare dashboard, **and**
- The **domain** you’re using is not allowed for this widget.

---

## Most likely cause of 110200

**Domain not allowed for this Turnstile widget.**

Cloudflare Turnstile ties each site key to a set of domains. If the page runs on a hostname that isn’t listed for that key, you get 110200.

### What to do

1. **Cloudflare Dashboard**  
   Go to **Turnstile** → your widget (site key `0x4AAAAAACame_Us1N8bvx4T`) → **Settings** / **Domains**.

2. **Add the exact host where you see the error**, for example:
   - Production: `strikeafterdark.eventbrella.us`
   - Vercel preview: your `*.vercel.app` host (e.g. `strike-after-dark-xxx.vercel.app`)
   - Local: `localhost` (and optionally `127.0.0.1`)

3. Save and wait a short time for propagation, then reload the checkout page.

4. **Optional:** In Cloudflare, confirm the site key value matches exactly: `0x4AAAAAACame_Us1N8bvx4T` (no extra characters or different key).

---

## Summary

- **Site key in HTML:** Hardcoded as `0x4AAAAAACame_Us1N8bvx4T` in both payment pages; no env var on frontend.
- **Backend:** Only `TURNSTILE_SECRET_KEY` is read from env; `CLOUDFLARE_TURNSTILE_SITE_KEY` is not used.
- **Error 110200:** Fix by adding the **exact domain** (and, if needed, `localhost`) in the Turnstile widget’s domain list in the Cloudflare dashboard.
