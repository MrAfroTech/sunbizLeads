# Codebase & Jobs Audit — Purpose & Use Case

Audit of all jobs, entry points, and workflows to confirm each matches the intended use case: **Florida multi-location operator lead generation** (10–200+ locations) → decision-maker enrichment → Brevo sync.

---

## Intended Use Case (from README)

- **Goal:** Find Florida multi-location operators (stadium/arena, casino, theme parks, university dining, airport concessions, restaurant chains, golf, marina, hotel F&B, entertainment).
- **Targets:** 50+ operators in 60 days, 70%+ with decision-maker email, pipeline &lt;2 hours, cost &lt;$50/week.
- **Flow:** Discovery → Qualification → Decision-maker enrichment (Hunter.io) → Bonus enrichments (POS/expansion) → Brevo sync.

---

## 1. Entry Points & Scripts

| Script / Command | Purpose | Use case fit |
|-----------------|--------|--------------|
| **`npm run pipeline`** | Runs full 5-stage TypeScript pipeline: Sunbiz discovery (stub) → Google Places count → qualify → Hunter.io DMs → POS/expansion (bonus) → Brevo sync. Writes to Supabase and `run_history`. | ✅ Correct. Primary production job for lead gen. |
| **`npm run run`** | Same as pipeline: `ts-node src/index.ts` → `runPipeline()`. | ✅ Redundant alias; both are correct. |
| **`npm start`** | Runs compiled `node dist/index.js` (same as index → runPipeline). | ✅ Correct for deployed/cron after `npm run build`. |
| **`npm run sunbiz`** | Runs **SerpAPI-based** scraper: `scripts/sunbiz-scraper.js`. Uses **Google search** (SerpAPI) per category, parses snippets for location counts, writes rows to **Google Sheet** (Florida Businesses + Error Log). **Does not** use Supabase or the 5-stage pipeline. | ⚠️ **Different use case:** Sheet-only lead list from web search, not DB pipeline. Complements pipeline if you want a separate “search-based” list in Sheets. |
| **`npm run build`** | Compiles TypeScript to `dist/`. | ✅ Correct. |
| **`npm test`** | Jest tests. | ✅ Correct. |

**Summary:**  
- **Pipeline** = DB + Brevo (Supabase, Hunter, Google Places, Brevo).  
- **Sunbiz script** = SerpAPI + Google Sheets only. Two different data flows; both are “lead gen” but different outputs (DB vs Sheet).

---

## 2. Pipeline Stages (Purpose Check)

| Stage | Purpose | Status |
|-------|--------|--------|
| **1. Multi-Location Discovery** | Sunbiz search → Google Places count → category → save to `multi_location_operators`. | ⚠️ Sunbiz is a **stub** (returns 0 candidates). Rest of stage is correct. |
| **2. Qualification** | Min locations, enabled categories, dedupe. | ✅ Implemented implicitly in Stage 1 (only qualified saved). |
| **3. Decision Maker Enrichment** | Hunter.io by domain → filter by titles → upsert `decision_makers`. | ✅ Correct. Requires operator `website`. |
| **4. Bonus Enrichments** | POS detection, expansion signals (high-priority categories only). | ⚠️ Implemented but **underfed:** no website HTML/job text for POS; expansion only gets `newDbasLast90Days: 0`. |
| **5. Brevo Sync** | Read `ready_for_outreach`, create Brevo contacts, set attributes, mark synced. | ✅ Correct. |

---

## 3. GitHub Actions Workflows

### 3.1 `.github/workflows/pipeline.yml` — “Pipeline”

| Field | Value | Issue |
|-------|--------|--------|
| **Name** | Pipeline | — |
| **Triggers** | Tue 19:00 UTC, Thu 17:00 UTC + `workflow_dispatch` | — |
| **Job** | `run` | — |
| **Steps** | checkout → setup-node 18 → install → build → **Run pipeline** | — |
| **Working directory** | `aiAgents/florida-sunbiz-scraper` | ❌ Repo is `sunbizLeads-clean`; path should match actual repo (e.g. `aiAgents/sunbizLeads-clean` or `.` if repo root is this project). |
| **Run command** | `node index.js` | ❌ Build outputs to `dist/index.js`. Should be `node dist/index.js` or `npm start`. |
| **Secrets** | SUNBIZ_SPREADSHEET_ID, ANTHROPIC_API_KEY, SERPAPI_API_KEY, BREVO_API_KEY | For full pipeline also need: SUPABASE_*, BREVO_LIST_ID, GOOGLE_PLACES_API_KEY, HUNTER_IO_API_KEY. |

**Purpose:** Run the full 5-stage pipeline on a schedule. **Use case:** ✅ Correct intent; **implementation:** path and run command need fixes.

---

### 3.2 `.github/workflows/sunbiz-scraper.yml` — “Florida Sunbiz Scraper”

| Field | Value | Issue |
|-------|--------|--------|
| **Name** | Florida Sunbiz Scraper | — |
| **Triggers** | Every 6 hours (`0 */6 * * *`) + `workflow_dispatch` | — |
| **Job** | `scrape` | — |
| **Steps** | checkout → setup-node 20 → create credentials from secret → npm ci → **Run** `node scripts/sunbiz-scraper.js` → cleanup credentials | — |
| **Working directory** | Repo root (no `working-directory` for run step) | ✅ Correct for this repo. |
| **Secrets** | GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON, SUNBIZ_SPREADSHEET_ID | ✅ Matches script (Sheets + SerpAPI optional). |

**Purpose:** Run the **SerpAPI/Sheets** scraper (not the Supabase/Brevo pipeline). **Use case:** ✅ Correct for a “Google search + Sheet” lead list. Distinct from the pipeline job.

---

## 4. Cron / Local Scheduling

| Item | Purpose | Use case fit |
|------|--------|--------------|
| **`scripts/cron-monday.sh`** | Runs `npm run pipeline` weekly (Monday 6 AM Eastern), appends to `logs/pipeline.log`. | ✅ Correct for the DB/Brevo pipeline. |

README suggests: `0 6 * * 1 /path/to/scripts/cron-monday.sh`.

---

## 5. Two Data Flows (Clarification)

| Flow | Entry | Output | Use case |
|------|--------|--------|----------|
| **A. Full pipeline** | `npm run pipeline` / `src/index.ts` / cron / Pipeline workflow | Supabase (`multi_location_operators`, `decision_makers`, `run_history`) + Brevo | Primary: multi-location discovery → qualify → enrich → sync to CRM. |
| **B. Sheet-only scraper** | `npm run sunbiz` / `scripts/sunbiz-scraper.js` / sunbiz-scraper workflow | Google Sheet (Florida Businesses, Error Log) | Alternative: SerpAPI search by category → append to Sheet. No DB/Brevo. |

Both are “Florida lead gen” but **A** is DB/Brevo-focused, **B** is Sheet-focused. Keeping both is valid if you want both outputs; otherwise you can retire one.

---

## 6. Issues to Fix for Correct Use Case

1. **Pipeline workflow (`.github/workflows/pipeline.yml`)**  
   - Set **working-directory** to this repo (e.g. `.` if this repo is the root, or `aiAgents/sunbizLeads-clean` if in a monorepo).  
   - Change **run** from `node index.js` to `node dist/index.js` (or `npm start`) after `npm run build`.  
   - Add pipeline-only secrets to the workflow if you run full stages: Supabase, Brevo list, Google Places, Hunter.

2. **Sunbiz discovery (pipeline Stage 1)**  
   - `src/scraper/sunbiz-multi.ts` is a stub (returns no candidates). For the pipeline to find operators from Florida state data, implement real Sunbiz search (e.g. Playwright/puppeteer on https://dos.myflorida.com/sunbiz/search/ or official API).

3. **Bonus enrichments (Stage 4)**  
   - POS: pipeline calls `detectPOS(companyName)` without `websiteHtml`/`jobPostingText`, so POS is effectively never set.  
   - Expansion: pipeline only passes `newDbasLast90Days: 0`; no Crunchbase/job/news data.  
   - Optional: feed website HTML/job text and real DBA/Crunchbase/news data if you want POS and expansion to be meaningful.

4. **Sheet client dependency**  
   - `scripts/lib/sheet-client.js` requires `config/credentials-config.js`, which expects `credentials/google-sheets-service-account.json` or env vars. Sunbiz-scraper workflow provides the JSON from secrets; local runs need the file or env.

---

## 7. Summary Table: “What runs when”

| What | When | Purpose |
|------|------|--------|
| **Pipeline (TS)** | Manual: `npm run pipeline`; Cron: Monday 6 AM ET; CI: Tue/Thu (if workflow path fixed) | Full 5-stage lead gen → Supabase + Brevo. |
| **Sunbiz scraper (JS)** | Manual: `npm run sunbiz`; CI: every 6 hours | SerpAPI search → Google Sheet (Florida Businesses). |
| **Cron script** | Monday 6 AM ET (if installed in crontab) | Same as “Pipeline (TS)”. |

All jobs are aligned with **Florida multi-location lead generation**; the pipeline is the main DB/Brevo use case, and the sunbiz-scraper is the Sheet-based alternative. Fixing the pipeline workflow path and run command will make CI match the intended use case.
