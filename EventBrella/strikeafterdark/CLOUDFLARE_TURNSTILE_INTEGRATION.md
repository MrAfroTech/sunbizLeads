# Cloudflare Turnstile Integration – Step-by-Step

This document describes how Turnstile was integrated into the Strike After Dark checkout so you can replicate it in another codebase that uses the **same .env files**.

---

## Prerequisites

- Cloudflare Turnstile **site key** (public) and **secret key** (server-only).
- The codebase that will be updated has access to the **same .env** as this one (e.g. `strikeafterdark/.env` or parent `EventBrella/.env`).

---

## 1. Environment variables (.env)

Add these to the same `.env` file(s) this codebase uses (project root and/or one level up):

```env
# Cloudflare Turnstile (checkout bot protection)
TURNSTILE_SITE_KEY=0x4AAAAAACame_Us1N8bvx4T
TURNSTILE_SECRET_KEY=0x4AAAAAACame--oRC-ySugjsmEYfDx4DWU
```

- **TURNSTILE_SITE_KEY** – Public; used in the widget (can be hardcoded in HTML if you prefer).
- **TURNSTILE_SECRET_KEY** – Secret; used only on the server to verify the token. Never expose in frontend.

For production (e.g. Vercel), add the same variables in the project’s Environment Variables so the backend can read `TURNSTILE_SECRET_KEY`.

---

## 2. Checkout page HTML

Do the following on **every** checkout/payment page that should be protected (e.g. `payment.html` and any platform-driven copy).

### 2.1 Add the Turnstile script in `<head>`

Place this **before** your main stylesheet (or at least early in `<head>`):

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

Example:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Tickets - ...</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <link rel="stylesheet" href="/styles/main.css">
    ...
</head>
```

### 2.2 Add hidden input and widget before the submit button

Inside the **payment form**, right **before** the submit button:

1. A **hidden input** to store the token when the callback runs.
2. The **Turnstile widget** div with `data-sitekey` and `data-callback`.

Use your actual site key. In this codebase the site key is hardcoded (no build step). If your app has a build that injects env vars, you can use that instead.

```html
<input type="hidden" id="cf-token" name="cfToken" />
<div class="cf-turnstile"
     data-sitekey="0x4AAAAAACame_Us1N8bvx4T"
     data-callback="onTurnstileSuccess"
     id="turnstileWidget"></div>
<button type="submit" class="btn-purchase" id="submitButton">
    ...
</button>
```

- **data-sitekey** – Your Turnstile site key (same as `TURNSTILE_SITE_KEY` in .env).
- **data-callback** – Name of a **global** JavaScript function Turnstile will call when the challenge succeeds. Required to avoid error 600010.

---

## 3. Checkout page JavaScript

### 3.1 Define the callback function (global)

The widget calls `onTurnstileSuccess(token)`. This function **must exist on `window`** (e.g. in your main payment script, at top-level, not inside a DOMContentLoaded handler).

Add this near the top of your payment script (e.g. `payment.js`):

```javascript
// Turnstile callback (required for widget - fixes error 600010)
function onTurnstileSuccess(token) {
    console.log('Turnstile token received');
    var hiddenInput = document.getElementById('cf-token');
    if (hiddenInput) hiddenInput.value = token;
}
```

- The callback receives the **token** string. Store it in the hidden input so the form submit handler can read it (and so Turnstile has a valid callback).

### 3.2 Form submit handler – get token and send it

In the function that runs when the user submits the payment form (e.g. `handlePayment`):

**Before** calling your checkout API:

1. **Get the token** from the hidden input (set by the callback) or, as fallback, from `turnstile.getResponse()`.
2. **If token is empty**, show an error and **return** (do not send the request).
3. **Include the token** in the JSON body of the POST (e.g. `cfTurnstileResponse`).
4. **On any submit error**, call `turnstile.reset()` so the user can try again.

Example:

```javascript
// 1. Get token (hidden input first, then getResponse)
const turnstileToken = (document.getElementById('cf-token') && document.getElementById('cf-token').value) ||
    (typeof turnstile !== 'undefined' ? turnstile.getResponse() : '');

if (!turnstileToken) {
    throw new Error('Please complete the security verification before continuing.');
}

// 2. Include in POST body (same key name your backend expects)
const paymentResponse = await fetch(`${API_BASE_URL}/stripe-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        // ... your existing fields (tier, eventDate, customerEmail, etc.)
        cfTurnstileResponse: turnstileToken
    })
});
```

In the **catch** block of the same submit handler:

```javascript
if (typeof turnstile !== 'undefined') turnstile.reset();
```

---

## 4. Backend – verify token on the checkout endpoint

In the **API route** that creates the checkout session (e.g. `api/stripe-payment.js` or your equivalent):

1. Read the token from the request body (e.g. `cfTurnstileResponse`).
2. If **TURNSTILE_SECRET_KEY** is set, **require** the token and verify it with Cloudflare **before** creating the session.
3. If verification fails or token is missing, return **400** and do **not** proceed with payment.

### 4.1 Read token from body

```javascript
const {
  tier,
  eventDate,
  customerEmail,
  customerName,
  // ... other fields
  cfTurnstileResponse: token
} = req.body;
```

### 4.2 Verify with Cloudflare

Place this **before** any payment logic (e.g. before validating required fields or creating a Stripe session):

```javascript
const secret = process.env.TURNSTILE_SECRET_KEY;
if (secret) {
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Security verification missing. Please complete the verification and try again.'
    });
  }
  const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const userIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '';
  const verifyRes = await fetch(verifyURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: userIP || undefined
    })
  });
  const data = await verifyRes.json();
  if (!data.success) {
    console.warn('Turnstile verification failed:', data);
    return res.status(400).json({
      success: false,
      message: 'Security verification failed. Please try again.'
    });
  }
}
```

- If `TURNSTILE_SECRET_KEY` is not set (e.g. local dev without .env), verification is **skipped** so existing flows still work.
- Use the **same body key** as the frontend (here: `cfTurnstileResponse`). If your frontend sends a different name, read that name in `req.body` and use it as `token`.

---

## 5. Domain configuration (Cloudflare dashboard)

Error **110200** = site key invalid or **domain mismatch**.

1. In **Cloudflare Dashboard** → **Turnstile** → select the widget (site key `0x4AAAAAACame_Us1N8bvx4T`).
2. Under **Domains** (or equivalent), add **every** host where the checkout page is served, for example:
   - Production: `strikeafterdark.eventbrella.us`
   - Preview: your `*.vercel.app` hostname
   - Local: `localhost` (and `127.0.0.1` if you use it)
3. Save. Changes can take a short time to apply.

---

## 6. File checklist (this codebase)

| What | Where in strikeafterdark |
|------|----------------------|
| Turnstile script in `<head>` | `public/payment.html`, `platformDrivenPages/tours/payment.html` |
| Hidden input + widget | Same two HTML files, inside form, before submit button |
| `onTurnstileSuccess` | `public/js/payment.js`, `platformDrivenPages/tours/payment.js` |
| Token in submit + reset on error | Same two JS files, in the payment submit handler |
| Backend verification | `api/stripe-payment.js` (right after reading `req.body`, before payment logic) |
| .env vars | `strikeafterdark/.env`, `EventBrella/.env` (and Vercel env for production) |

---

## 7. Optional – use site key from env on the frontend

This codebase uses a **hardcoded** site key in the HTML. If your other codebase has a **build step** (e.g. Vite, Next, Create React App):

- Expose the site key via an env var (e.g. `VITE_TURNSTILE_SITE_KEY` or `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
- In your template/component, set `data-sitekey` to that variable so the same .env values can drive both codebases without hardcoding the key in HTML.

Static HTML with no build step: keep the site key in the HTML as in this guide, or inject it at deploy time if your host supports it.

---

## 8. Summary

1. **.env** – Add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (same files as this codebase).
2. **HTML** – Load Turnstile script in `<head>`; add hidden input + widget with `data-sitekey` and `data-callback="onTurnstileSuccess"` before the submit button.
3. **JS** – Define global `onTurnstileSuccess(token)` and store `token` in `#cf-token`; in submit handler, read token (hidden input or `turnstile.getResponse()`), require it, send as `cfTurnstileResponse`, and call `turnstile.reset()` on error.
4. **Backend** – Read `cfTurnstileResponse` from body; if `TURNSTILE_SECRET_KEY` is set, verify with `https://challenges.cloudflare.com/turnstile/v0/siteverify` and return 400 if missing or invalid.
5. **Cloudflare** – Add all checkout domains (production, preview, localhost) to the widget’s allowed domains.

After this, any codebase that shares the same .env and follows these steps will have the same Turnstile integration as Strike After Dark.
