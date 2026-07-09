# Team Outreach Agent

Standalone script that reads team data from a Google Sheet, visits each team's website, scrapes emails and decision makers, and fills contact forms with personalized outreach.

## Isolation

- All files live inside `team-outreach/` only
- No modifications to any files outside this folder
- No deployment config, version control, or package manager files (no `package.json`, `vercel.json`, `.git`, etc.)

## Input

Google Sheet with two columns:

| Team Name | Website URL |
|-----------|-------------|
| Orlando Magic | https://www.nba.com/magic |
| ... | ... |

## Output

The script adds/updates these columns per row:

- **Emails Found** — Comma-separated emails scraped from About/Contact pages
- **Decision Makers Found** — Name + title pairs (GM, President, Director of Partnerships, etc.)
- **Form Page URL** — Exact URL where the contact form (or CAPTCHA) was found
- **Form Submitted** — `Yes`, `No - Form Not Found`, or `No - Error`
- **CAPTCHA Flagged** — `Yes` if reCAPTCHA/hCaptcha detected, else blank
- **Needs Human Follow-Up** — `Yes` if CAPTCHA or submission failed, else blank
- **Timestamp** — When the row was processed

## Setup

1. **Python 3.8+** required

2. **Install dependencies** (from `team-outreach/`):

   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **Google Sheets API**
   - Create a [Google Cloud service account](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Enable the Google Sheets API
   - Download the JSON key
   - Save it as `team-outreach/credentials/google-sheets-service-account.json`
   - Share your target Google Sheet with the service account email (Editor)

4. **Environment**
   - Copy `.env.example` to `.env`
   - Fill in:
     - `SHEET_ID` — Your Google Sheet ID (from the URL)
     - `GOOGLE_CREDENTIALS_PATH` — Path to service account JSON (or leave default)
     - `SENDER_NAME`, `SENDER_EMAIL`, `SENDER_PHONE` — Used when filling contact forms
     - `MESSAGE_TEMPLATE` — Optional. Placeholders: `[TEAM_NAME]`, `[FIRST_CONTACT]`

## Run

```bash
cd team-outreach
python agent.py
```

- **Visible browser** — Chromium opens so you can watch forms being filled
- Processes rows **sequentially**
- 3–5 second randomized delay between rows
- Logs to `outreach.log`
- Writes run history to `outreach.db` (SQLite)

## Human-Aided CAPTCHA Flow

The agent uses **human-aided automation** when a CAPTCHA is present:

1. The agent **fills all form fields** (name, email, phone, message) first
2. The browser **stays open** on the page where the CAPTCHA appeared
3. A **desktop alert** pops up: *"CAPTCHA detected on [TEAM NAME]. Solve the CAPTCHA in the browser, then click OK to submit and continue."*
4. Solve the CAPTCHA in the visible Chromium window
5. Click **OK** — the agent submits the form programmatically
6. **If submission succeeds:** `Form Submitted` = Yes, `Form Page URL` recorded → next row
7. **If submission fails** (or you close the alert without solving): `Form Submitted` = No - Error, `CAPTCHA Flagged` = Yes, `Needs Human Follow-Up` = Yes → next row

## Message Template

The message is the most important variable. Set it in `.env` as `MESSAGE_TEMPLATE`:

- `[TEAM_NAME]` — Replaced with the Team Name from the sheet
- `[FIRST_CONTACT]` — Replaced with the first decision maker found, or "there"
- Use `\n` for newlines in a single-line value

If omitted, the default Seamlessly/Orlando Pirates pitch is used.

## Folder Structure

```
team-outreach/
  agent.py
  .env.example
  requirements.txt
  outreach.log
  outreach.db          (SQLite, created on first run)
  README.md
  credentials/
    google-sheets-service-account.json   (you add this)
```
