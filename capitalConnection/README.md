# The Capital Connection — Standalone Website

A **complete, runnable React website** for the invite-only Capital Connection event. Three pages: main landing (Investor/Founder choice), investor landing, founder landing. Request Invitation form with validation; MVP stores submissions in localStorage and console when no API is configured.

## Quick start

```bash
cd capitalConnection
npm install
npm start
```

- Browser opens at **http://localhost:3000** (or next free port, e.g. 3001 if 3000 is in use).
- You should see the homepage with **Investor** and **Founder** buttons.
- Click **Investor** → `/investors` (full investor landing page).
- Click **Founder** → `/founders` (full founder landing page).

## Run on a specific port

If SeamlessVendorUI or another app is on 3000:

**Unix/macOS:**

```bash
PORT=3001 npm start
```

**Windows (cmd):**

```cmd
set PORT=3001 && npm start
```

Or create a `.env` in `capitalConnection` with:

```
PORT=3001
```

## Project structure (website, not a library)

```
capitalConnection/
  public/
    index.html          ← HTML entry
  src/
    index.js            ← React entry
    App.js              ← Router: /, /investors, /founders
    config.js           ← Event details (env + defaults)
    pages/
      HomePage.js       ← Landing with Investor/Founder choice
      InvestorsPage.js   ← Investor landing page
      FoundersPage.js   ← Founder landing page
    components/
      InviteForm.js     ← Request Invitation modal
    styles/
      App.css
      CapitalDinner.css
      InviteForm.css
  package.json
  vercel.json           ← SPA rewrites for deploy
  README.md
```

## Updating event details

Edit **`src/config.js`** or set environment variables (Create React App uses `REACT_APP_*`):

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_CAPITAL_DINNER_DATE` | Event date | `Thursday, March 20, 2025` |
| `REACT_APP_CAPITAL_DINNER_TIME` | Event time | `7:00 PM - 10:00 PM` |
| `REACT_APP_CAPITAL_DINNER_VENUE_NAME` | Venue name | `Ferrari of Central Florida` |
| `REACT_APP_CAPITAL_DINNER_VENUE_LOCATION` | City | `Orlando` |
| `REACT_APP_CAPITAL_DINNER_CONTACT_EMAIL` | Contact email | `events@seamlessly.us` |
| `REACT_APP_CAPITAL_DINNER_INVESTOR_SEATS` | Investor seats text | `15` |
| `REACT_APP_CAPITAL_DINNER_FOUNDER_SEATS` | Founder spots text | `12` |

Rebuild after changing env vars.

## Form (Request Invitation)

- **MVP (no API):** Submissions are logged to the console and appended to `localStorage` under the key `capital-connection-invites`. Success message is shown.
- **With API:** Set `REACT_APP_API_BASE_URL` to your backend base URL (e.g. `https://your-api.vercel.app`). The form will `POST` to `${REACT_APP_API_BASE_URL}/api/capital-connection-invite` with the same payload shape. Connect that endpoint to your database or CRM when ready.

## Deploy to Vercel

1. Push the repo (or connect the `capitalConnection` folder as the root of a Vercel project).
2. Vercel will use `package.json` and build with `npm run build`; output is `build/`.
3. `vercel.json` includes SPA rewrites so `/investors` and `/founders` load the app correctly.
4. Set any `REACT_APP_*` env vars in the Vercel project settings.

## Success criteria

- **Run:** `cd capitalConnection && npm install && npm start` → browser shows the site.
- **Navigate:** Homepage → Investor / Founder → full landing pages; direct URLs `/investors`, `/founders` work.
- **Form:** Request Invitation opens modal; validation works; on submit, success message and (MVP) localStorage + console.
- **Deploy:** Deploy to Vercel; visiting the URL shows the website and all three routes work.
