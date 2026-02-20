# Florida Multi-Location Operator Lead Generation

Pipeline that finds Florida multi-location operators (10–200+ locations), enriches with decision maker contacts, and syncs to Brevo.

**Focus:** Stadium/arena, casino, theme parks, university dining, airport concessions, restaurant chains, golf, marina groups, hotel F&B, entertainment venues.

**Goal:** 50+ operators in 60 days, 70%+ with decision maker email, pipeline &lt;2 hours, cost &lt;$50/week.

---

## Quick Start

1. **Clone and install**
   ```bash
   cd aiAgents/florida-sunbiz-scraper
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Set the four variables in `.env` (see `.env.example`):

   | Variable | Purpose |
   |----------|--------|
   | `SUNBIZ_SPREADSHEET_ID` | Google Sheet for Florida Sunbiz output (same service account as speaking; different sheet) |
   | `ANTHROPIC_API_KEY` | AI (Claude) – same as workflows-speaking-production |
   | `SERPAPI_API_KEY` | SerpAPI – same as workflows-speaking-production |
   | `BREVO_API_KEY` | Brevo – same as workflows-speaking-production |

   Config loads **`aiAgents/.env`** first, then **`florida-sunbiz-scraper/.env`** (local overrides), so you can keep these in the parent `.env` if shared across workflows.

   **If you run the full 5-stage pipeline** (Supabase DB, Google Places, Hunter.io, Brevo sync), add in `aiAgents/.env` or here: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BREVO_LIST_ID`, `GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY`. Optional: `NOTIFICATION_EMAIL` + SMTP, `LINKEDIN_API_KEY`, Google Sheets auth.

3. **Supabase** (only if running full pipeline)
   - Create a project at [supabase.com](https://supabase.com).
   - Run `supabase/schema.sql` in the SQL Editor.
   - Put `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env` (here or in `aiAgents/.env`).

4. **Brevo** (only if running full pipeline)
   - Use existing list (or create "FL Multi-Location Leads").
   - Create custom attributes: COMPANY_NAME, CATEGORY, ESTIMATED_LOCATIONS, POS_SYSTEM, EXPANSION_SCORE, LINKEDIN_URL, HQ_CITY, HQ_STATE.
   - Set `BREVO_LIST_ID` in `.env`.

5. **Run pipeline**
   ```bash
   npm run pipeline
   ```

6. **Schedule (e.g. Monday 6 AM EST)**
   ```bash
   chmod +x scripts/cron-monday.sh
   # Crontab: 0 6 * * 1 /path/to/scripts/cron-monday.sh
   ```

---

## Pipeline (5 Stages)

1. **Multi-Location Discovery** – Sunbiz search (Group, Concepts, Holdings, Partners) → Google Places count → LinkedIn verify → Save to DB
2. **Qualification** – Min 10 locations, enabled categories, dedupe → Mark qualified
3. **Decision Maker Enrichment** – Hunter.io domain search → Save to DB
4. **Bonus Enrichments** – POS detection, expansion signals (high-priority categories only)
5. **Brevo Sync** – Unsynced decision makers → Create contacts → Mark synced

---

## Config

- **Categories:** `config/categories.json` – toggle categories, keywords, min locations, decision maker titles
- **Cost cap:** $100/week max, alert at $75

---

## Views

- `operators_by_category` – Count and sum of locations per category
- `ready_for_outreach` – Decision makers with email, sorted by priority
- `category_performance` – Operators, with-email, synced per category

---

## Sunbiz Implementation

The Sunbiz multi-location search (`src/scraper/sunbiz-multi.ts`) is a stub. Implement actual search via:
- Sunbiz search by entity name: https://dos.myflorida.com/sunbiz/search/
- Keywords: Group, Concepts, Holdings, Partners, Ventures, plus category keywords from `config/categories.json`
- Use Playwright/puppeteer for scraping if no API is available
