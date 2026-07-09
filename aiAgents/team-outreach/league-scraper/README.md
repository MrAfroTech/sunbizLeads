# League Team Scraper

Scrapes team names and official websites for multiple independent baseball leagues and writes/upserts them into a dedicated Google Sheet.

## Isolation

- All code lives inside `team-outreach/league-scraper/`
- No files outside this folder are modified
- No `package.json`, `vercel.json`, `.git`, or deployment configs

## Leagues Covered

- Atlantic League — `atlanticleague.com`
- Frontier League — `frontierleague.com`
- American Association — `aabaseball.com`
- Pioneer League — `pioneerleague.com`
- Pecos League — `pecosleague.com`
- Empire League — `empireproleague.com`
- MLB Draft League — `mlbdraftleague.com`
- Pacific Association — `pacificassociation.com` (historical / best-effort)

## What It Does

- Opens a **visible Chromium browser** via Playwright
- For each league:
  - Navigates to its Teams / Clubs page (using known paths + nav link heuristics)
  - Finds team entries on that page
  - For each team:
    - Extracts **Team Name** from link text
    - Resolves a **team URL** from the teams page
    - If that URL is a league-hosted team page, visits it to find an external **official team website**
    - Falls back to the league-hosted team page URL if no external site is found
  - Writes each team into a Google Sheet, one row per team
  - Also logs each scrape into a local SQLite DB

## Google Sheet Output

The agent writes to a separate Google Sheet whose ID is stored in the parent `.env` as `TEAMS_SHEET_ID`.

Each row has:

- **League** — League name (e.g. `Atlantic League`)
- **Team Name** — Team name string from the league site
- **Website URL** — Resolved official team website URL
- **Scraped At** — Datetime when this row was written/updated

If a row with the same `League` + `Team Name` already exists, it is **updated** (upsert behavior) instead of duplicated.

## Setup

1. **Python & dependencies**

   From `team-outreach/` (parent folder):

   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

2. **Environment (.env)**

   In `team-outreach/.env` (parent folder), add:

   ```dotenv
   TEAMS_SHEET_ID=your_teams_google_sheet_id_here
   ```

   This reuses the same Google Sheets credentials and `GOOGLE_CREDENTIALS_PATH` as the main `agent.py`.

3. **Google Sheets**

   - Create a Google Sheet for league/team data
   - Grab its Sheet ID from the URL
   - Share it with the same service account used for `agent.py`

## Run

From the `league-scraper` folder:

```bash
cd team-outreach/league-scraper
python scraper.py
```

- Launches **visible Chromium**
- Scrapes leagues sequentially
- Adds a **2–3 second randomized delay** between team page visits to be polite
- Logs activity to `scraper.log`
- Stores per-team scrape records in `scraper.db`

## Folder Structure

```text
team-outreach/
  league-scraper/
    scraper.py
    scraper.log        (created on first run)
    scraper.db         (SQLite, created on first run)
    README.md
```
