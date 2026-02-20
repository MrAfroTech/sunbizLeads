# Florida Sunbiz Scraper — A-to-Z Explanation for Grading

This document explains the **florida-sunbiz-scraper** project from end to end so a grader (e.g., Claude) can evaluate design, implementation, completeness, **who we are targeting**, **what human tasks are required**, and **what we’ve done**.

---

## Who we are targeting

**Companies (the “lead”):**  
Florida-based **multi-location operators** with **10–200+ locations** in these segments:

- Stadium / arena (concessions, venue management)
- Casino / gaming / resort
- Theme park / attraction / entertainment park
- University / college / campus dining
- Airport concessions / aviation / terminal
- Restaurant chain (group, concepts, holdings)
- Golf management / country club
- Marina group / yacht club / waterfront
- Hotel F&B / resort / hospitality / lodging
- Entertainment venue / theater / amphitheater

**People (the “decision maker” we want to contact):**  
We target job titles that typically own operations, F&B, or multi-site strategy, for example:

- VP Operations, VP of Operations, Vice President Operations  
- Director F&B, Director of F&B, Director of Food, Director of Concessions  
- COO, Chief Operating Officer  
- Regional Manager, Regional Director  
- GM, General Manager  
- (Category-specific titles are in `config/categories.json` per segment.)

**Outcome:** Contacts (email, optional phone) for these decision makers are synced into **Brevo** for sales/partnership outreach (e.g. POS, payments, or venue solutions).

---

## Human tasks required

These are tasks a **human** must do; the script does not do them.

### One-time setup

1. **Repo and env**
   - Clone repo, run `npm install`, create `logs/` if using cron (script tees to `logs/pipeline.log`).
   - Copy `.env.example` to `.env`. The project **`.env`** has four variables: **`SUNBIZ_SPREADSHEET_ID`** (Google Sheet for Sunbiz output), **`ANTHROPIC_API_KEY`** (Claude), **`SERPAPI_API_KEY`**, **`BREVO_API_KEY`**. Same as workflows-speaking-production; sheet uses a different spreadsheet. **Env loading:** `src/config.ts` loads **`aiAgents/.env`** first, then **local `.env`** (local overrides).
   - **For the full 5-stage pipeline** (Supabase, Google Places, Hunter, Brevo sync), also set in `aiAgents/.env` or here: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BREVO_LIST_ID`, `GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY`. Optional: `NOTIFICATION_EMAIL` + SMTP, `LINKEDIN_API_KEY`, Google Sheets auth.

2. **Supabase** (only if running full pipeline)
   - Create a Supabase project at supabase.com.
   - Run the full `supabase/schema.sql` in the SQL Editor (creates tables and views).
   - Put `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env` (here or in `aiAgents/.env`).

3. **Brevo** (only if running full pipeline)
   - Create or choose a list (e.g. “FL Multi-Location Leads”).
   - Create these **custom contact attributes** in Brevo:  
     `COMPANY_NAME`, `CATEGORY`, `ESTIMATED_LOCATIONS`, `POS_SYSTEM`, `EXPANSION_SCORE`, `LINKEDIN_URL`, `HQ_CITY`, `HQ_STATE`.
   - Set `BREVO_LIST_ID` in `.env` to that list’s ID.

4. **API keys** (only if running full pipeline)
   - Obtain and set in `.env`: Google Places API key, Hunter.io API key (in addition to the four in `.env.example`).

5. **Optional: email report**
   - Set `NOTIFICATION_EMAIL` and SMTP vars in `.env` if you want the pipeline to email a summary after each run.

6. **Optional: scheduling**
   - To run weekly: `chmod +x scripts/cron-monday.sh` and add to crontab:  
     `0 6 * * 1 /path/to/florida-sunbiz-scraper/scripts/cron-monday.sh`

### Tuning (human decisions)

7. **Categories**  
   Edit `config/categories.json` to enable/disable categories, change `sunbiz_keywords`, `min_locations`, `decision_maker_titles`, or `priority` (priority ≤ 5 drives “high-priority” bonus enrichments).

8. **Cost and rate limits**  
   In `src/config.ts` (or via env if you add it): `costCapUsd`, `costAlertThresholdUsd`, `delayBetweenRequestsMs`, `pipelineTimeoutMinutes`. Human must decide limits and monitor.

### Ongoing / periodic

9. **Sunbiz discovery (critical gap)**  
   The pipeline’s Sunbiz search is a **stub** and returns no candidates. A human (or dev) must implement real Sunbiz search (e.g. Playwright/puppeteer on https://dos.myflorida.com/sunbiz/search/ using entity-name + keywords) if the pipeline is to find new operators from Florida state records.

10. **Monitoring**  
    - Check `run_history` in Supabase after each run (counts, errors, cost placeholder).  
    - If email report is configured, read the summary; otherwise check console output or `logs/pipeline.log`.  
    - Triage errors (e.g. Brevo rate limits, missing attributes, API failures).

11. **Outreach in Brevo**  
    The script only **sends contacts to Brevo**. A human must run campaigns (sequences, emails, calls) using the synced list and attributes.

12. **Operators without website**  
    The script only finds decision makers when an operator has a `website` (for Hunter.io domain search). Adding or correcting websites for operators (e.g. from Sunbiz or manual research) is a human task unless future code adds another source.

---

## What we’ve done (implementation summary)

- **Pipeline orchestration:** Full 5-stage flow in `src/pipeline.ts` (discovery → qualification → decision-maker enrichment → bonus enrichments → Brevo sync), triggered from `src/index.ts` and runnable via `npm run pipeline` or cron.
- **Data model:** TypeScript types in `src/types.ts` and Supabase schema in `supabase/schema.sql`: tables `multi_location_operators`, `decision_makers`, `run_history`; views `operators_by_category`, `ready_for_outreach`, `category_performance`.
- **Discovery (Stage 1):** Sunbiz keyword set built from config; **Sunbiz search itself is a stub** (returns no rows). Multi-location detection (keyword + DBA rules), Google Places location count, and category classification are implemented; qualified operators are upserted to the DB.
- **Qualification (Stage 2):** Implemented implicitly in Stage 1 (only qualified operators are saved; min locations and category rules applied).
- **Decision-maker enrichment (Stage 3):** Hunter.io domain search implemented; results filtered by decision-maker titles and upserted into `decision_makers`. Requires operator `website`; no LinkedIn or other fallback.
- **Bonus enrichments (Stage 4):** POS detector and expansion detector exist but pipeline does not pass website HTML, job text, or real DBA/news/crunchbase data, so POS and expansion remain empty/low in practice.
- **Brevo sync (Stage 5):** Implemented: read `ready_for_outreach`, create Brevo contact (with duplicate check by email), set custom attributes, add to list, mark `synced_to_brevo` and store `brevo_contact_id`.
- **Config and categories:** `config.ts` loads env and `config/categories.json`; categories drive keywords, min locations, titles, and priority; cost caps and delays are in config.
- **Observability:** Each run inserts a row into `run_history`; optional SMTP report emails a short summary (operators found, decision makers, synced, errors, cost placeholder, duration).
- **Cron and docs:** `scripts/cron-monday.sh` for Monday 6 AM Eastern; README and this A–Z doc for setup, targeting, and grading.

---

## A. Purpose and Goals

**What it is:** A lead-generation pipeline that finds **Florida multi-location operators** (companies with 10–200+ locations), enriches them with **decision-maker contacts** (email/phone), and syncs those contacts to **Brevo** (CRM) for outreach.

**Target segments:** Stadium/arena, casino, theme parks, university dining, airport concessions, restaurant chains, golf, marina groups, hotel F&B, entertainment venues.

**Explicit goals (from README):**
- 50+ operators in 60 days
- 70%+ with decision-maker email
- Pipeline runtime &lt;2 hours
- Cost &lt;$50/week (config has $100 cap, $75 alert)

---

## B. How to Run

- **One-off pipeline:** `npm run pipeline` (runs `ts-node src/pipeline.ts`)
- **Entry script:** `src/index.ts` — imports `runPipeline()` from `src/pipeline.ts`, runs it, then `process.exit(0)` or `process.exit(1)` on error
- **Scheduling:** `scripts/cron-monday.sh` runs the pipeline every Monday 6:00 AM Eastern and appends output to `logs/pipeline.log` (crontab: `0 6 * * 1 /path/to/scripts/cron-monday.sh`)

**Environment:** Copy `.env.example` to `.env`. The project **`.env`** has four variables: **`SUNBIZ_SPREADSHEET_ID`**, **`ANTHROPIC_API_KEY`**, **`SERPAPI_API_KEY`**, **`BREVO_API_KEY`** (same as workflows-speaking-production). Config loads **`aiAgents/.env`** first, then **local `.env`**. For the full 5-stage pipeline, add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BREVO_LIST_ID`, `GOOGLE_PLACES_API_KEY`, `HUNTER_IO_API_KEY` (in aiAgents or local .env). Optional: SMTP, LinkedIn, Google Sheets auth.

---

## C. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  index.ts → runPipeline() (pipeline.ts)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Stage 1: Discovery     → Sunbiz (stub) → Google Places count → DB upsert    │
│  Stage 2: Qualification → (folded into Stage 1: only qualified saved)       │
│  Stage 3: Enrichment    → Hunter.io per operator domain → decision_makers   │
│  Stage 4: Bonus         → POS + expansion (high-priority categories only)    │
│  Stage 5: Brevo Sync    → ready_for_outreach → createContact → mark synced  │
├─────────────────────────────────────────────────────────────────────────────┤
│  After pipeline: insert run_history, send email report (if SMTP configured)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key dependencies:** TypeScript, Supabase (DB), Brevo (CRM), Google Places API, Hunter.io. Config from `config.ts` + `config/categories.json`.

---

## D. Pipeline Stages in Detail

### Stage 1: Multi-Location Discovery

1. **Candidates:** `searchSunbizMulti({ maxResults: 50 })` in `src/scraper/sunbiz-multi.ts` returns a list of **multi-location candidates**.  
   - **Important:** This is a **stub**. It builds a set of keywords from `config/categories.json` (enabled categories’ `sunbiz_keywords`) plus hardcoded terms (group, concepts, holdings, partners, ventures, etc.) but **returns an empty array** — no real Sunbiz HTTP/scrape is implemented. README says: implement via Sunbiz search by entity name (e.g. Playwright/puppeteer).

2. **Per candidate:**  
   - Skip if `hasSunbizMultiIndicators(c)` is false (name must contain one of: group, concepts, holdings, partners, ventures, enterprises, OR have ≥5 DBAs).  
   - Call **Google Places** `countLocationsForBrand(c.company_name)` (with rate-limit delay).  
   - Call **detectMultiLocation(c, googleCount)** which:  
     - Uses **resolveLocationCount(googleCount)** — currently only one source (Google), so `sources.length < 2` unless manual/DBA override; requires `min_locations` (10) and for multi-location logic.  
     - Gets **category** from **classifyByKeywords(company_name)** (keyword match against `categories.json`).  
   - If result exists and `location_count >= config.multiLocation.minLocations` and category is **enabled** and meets category’s **min_locations**, build a **MultiLocationOperator** and append to `qualifiedOperators`.

3. **Persistence:** Each qualified operator is **upserted** into `multi_location_operators` (on `document_number` when present, else insert). Stage 2 is “implicit” because only qualified operators are ever saved.

### Stage 3: Decision Maker Enrichment

1. Load all qualified operators from `multi_location_operators` (id, company_name, website, category).
2. For each operator, **extract domain** from `website` via `extractDomainFromUrl`. If no domain, skip.
3. Call **findDecisionMakers(company_name, domain)** (rate-limited):  
   - Uses **Hunter.io** domain search API (`/v2/domain-search`) when `HUNTER_IO_API_KEY` is set.  
   - Filters returned emails by **DECISION_MAKER_TITLES** (VP Operations, Director F&B, COO, Regional Manager, GM, etc.).  
   - Returns list of `DecisionMakerFinderResult` (name, title, email, phone, linkedin_url, confidence).  
4. For each decision maker with an email, **upsert** into `decision_makers` (unique on `company_id, email`), with `data_sources: ['hunter']`, `synced_to_brevo: false`.

**Note:** Operators without `website` never get decision makers; no LinkedIn/other source is implemented for finding contacts when domain is missing.

### Stage 4: Bonus Enrichments (POS + Expansion)

- Only for operators whose category is in the **high-priority** set (priority ≤ 5 in `categories.json`): stadium_arena, casino, theme_park, university_dining, airport_concessions.
- **POS:** `detectPOS(op.company_name)` — in `pos-detector.ts` it only looks at `websiteHtml` and `jobPostingText`; both are **undefined** when called from the pipeline, so the combined string is empty and **POS is never detected** in the current flow.
- **Expansion:** `detectExpansion({ newDbasLast90Days: 0 })` — pipeline always passes 0 for new DBAs; other inputs (crunchbase, job openings, news) are not gathered, so expansion signals are only possible from the 0-input branches (effectively none in practice).
- Results are written to `multi_location_operators` (pos_system, pos_confidence, expansion_signals, expansion_score).

### Stage 5: Brevo Sync

1. Select from view **ready_for_outreach** (decision makers with email, not yet synced, joined with operator info), limit 100.
2. For each row: **createContact** in Brevo (email, phone, company, firstName/lastName from full_name, plus custom attributes: COMPANY_NAME, CATEGORY, ESTIMATED_LOCATIONS, POS_SYSTEM, EXPANSION_SCORE, LINKEDIN_URL, HQ_CITY, HQ_STATE).  
   - **createContact** in `src/brevo.ts`: checks existing by email via `findContactByEmail`; if exists returns `duplicate: true`; else creates contact with `listIds: [config.brevo.listId]` and marks success.
3. If created (not duplicate): update `decision_makers` set `synced_to_brevo = true`, `brevo_contact_id = result.brevoContactId`.
4. Errors collected and reported.

---

## E. Data Model and Persistence

**Types (`src/types.ts`):**  
- **OperatorCategory** — enum-like union: stadium_arena, casino, theme_park, university_dining, airport_concessions, restaurant_chain, golf_management, marina_group, hotel_fb, entertainment_venue.  
- **MultiLocationOperator** — company_name, document_number, category, estimated_location_count, location_count_source, sunbiz_indicators, website, hq_*, pos_system, expansion_signals, is_qualified, etc.  
- **DecisionMaker** — company_id, full_name, title, email, phone, linkedin_url, data_sources, email_confidence, synced_to_brevo, brevo_contact_id.  
- **RunHistory** — run_date, counts, categories_breakdown, errors, cost_estimate_usd, duration_seconds.  
- Supporting types: SunbizIndicators, ExpansionSignal, DecisionMakerFinderResult, MultiLocationDetectorResult, CategoryConfig, etc.

**Supabase (`supabase/schema.sql`):**  
- **multi_location_operators** — PK id, document_number unique, category, estimated_location_count, sunbiz_indicators (JSONB), expansion_signals (JSONB), pos_system, expansion_score, is_qualified, timestamps. Indexes on category, estimated_location_count, expansion_score, is_qualified.  
- **decision_makers** — company_id FK to multi_location_operators, unique (company_id, email), synced_to_brevo, brevo_contact_id. Indexes on company_id, email, synced_to_brevo.  
- **run_history** — run_date, multi_location_operators_found, decision_makers_found, categories_breakdown (JSONB), errors (JSONB), cost_estimate_usd, duration_seconds.  
- **Views:**  
  - **operators_by_category** — qualified operators, count and sum of locations per category.  
  - **ready_for_outreach** — decision makers with email, not synced, joined with operator; ordered by expansion_score DESC, estimated_location_count DESC.  
  - **category_performance** — per category: operator count, with_email count, synced count.

**DB client:** `src/db/supabase.ts` — singleton `getSupabase()` using `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from config.

---

## F. Configuration

- **config.ts:** Loads `.env` via dotenv; reads `config/categories.json` for `multiLocation.categories`. Exports `config` with: supabase, anthropic, brevo, google, hunter, serpApi, linkedin, notification (email + smtp), run (costAlertThresholdUsd 75, costCapUsd 100, pipelineTimeoutMinutes 120, delayBetweenRequestsMs 1500), multiLocation (minLocations 10, maxLocations 200, minConfirmationSources 2, categories from JSON).
- **config/categories.json:** One object per category: name, enabled, sunbiz_keywords, min_locations, decision_maker_titles, priority. Used for: Sunbiz keyword set, category classification, min_locations per category, and high-priority filter (priority ≤ 5) for Stage 4.

---

## G. Agents / Logic Modules (`src/agents/multiLocation/`)

- **multi-location-detector.ts:**  
  - **hasSunbizMultiIndicators(candidate)** — true if company name contains one of the multi-indicator keywords or dba_count ≥ 5.  
  - **resolveLocationCount(google, linkedin?, manual?)** — builds sources array, requires MIN_CONFIRMATION_SOURCES (2) for non-override, computes count and confidence.  
  - **detectMultiLocation(candidate, googleCount, linkedin?)** — resolves count, enforces MIN_LOCATIONS (10), then **classifyByKeywords** for category; returns MultiLocationDetectorOutput or null.

- **category-classifier.ts:**  
  - **classifyByKeywords(companyName)** — scores each enabled category by keyword match (score = sum of keyword lengths); best match wins; fallback category `restaurant_chain` if no match; confidence from score (≥15 high, ≥8 medium).  
  - **validateCategoryWithPlaces(category, placesTypes)** — optional validation vs Google Place types (not used in pipeline currently).

- **decision-maker-finder.ts:**  
  - **findDecisionMakers(companyName, domain?, titles)** — calls Hunter.io domain search when domain and API key exist; filters by DECISION_MAKER_TITLES; returns list with email (required).  
  - **extractDomainFromUrl(url)** — URL parsing, strip www.

- **pos-detector.ts:**  
  - **detectPOS(companyName, websiteHtml?, jobPostingText?)** — keyword match against POS_KEYWORDS (toast, square, clover, aloha, micros). Pipeline calls with no html/job text, so result is always null/low.

- **expansion-detector.ts:**  
  - **detectExpansion(inputs)** — builds ExpansionSignal[] and expansion_score from: crunchbase funding (last 12 months), newDbasLast90Days ≥ 2, job openings surge vs baseline, news mentions with expansion keywords. Pipeline only passes `{ newDbasLast90Days: 0 }`, so only the DBA branch could fire (and doesn’t with 0).

---

## H. Integrations

- **Sunbiz (`src/scraper/sunbiz-multi.ts`):** Stub only. Returns empty array. README describes intended approach: search by entity name on Sunbiz, keywords from config + Group/Concepts/Holdings/Partners, possibly Playwright/puppeteer.
- **Google Places (`src/integrations/google-places.ts`):** Text Search API for `"brandName FL"`; returns result count (up to 20 per page; next_page_token noted but not paginated for cost control).
- **Hunter.io:** Used inside decision-maker-finder via domain-search API; filters by title; returns name, email, position, linkedin, confidence.
- **Brevo (`src/brevo.ts`):** getContactInfo by email to detect duplicate; createContact with listIds and attributes; returns SyncResult (success, duplicate, brevoContactId, error).

---

## I. Post-Pipeline: Run History and Notifications

- **run_history** row inserted with: run_date, operatorsFound, decisionMakersFound, categoriesBreakdown, avgLocations, expansionSignalsDetected, errors array, cost_estimate_usd (placeholder 5), duration_seconds.
- **sendReport(report):** If `config.notification.email` and `config.notification.smtp.host` are set, sends an email via nodemailer with summary (operators found, decision makers, category breakdown, avg locations, expansion signals, synced, duplicates, error count, cost, duration).

---

## J. What Is Implemented vs Stub / Missing

| Component | Status | Notes |
|-----------|--------|--------|
| Sunbiz search | **Stub** | Returns []; no HTTP/scrape; README says to implement with Playwright or API |
| Google Places count | Implemented | Text Search; single page (no pagination) |
| Multi-location detection | Implemented | Uses Google count + keyword/DBA rules; 2-source confirmation rarely met (no LinkedIn) |
| Category classification | Implemented | Keyword-based from categories.json |
| Decision maker (Hunter) | Implemented | Domain required; Hunter.io domain search + title filter |
| POS detection | Implemented but ineffective | No website/html or job text passed from pipeline → always null |
| Expansion detection | Implemented but underused | Pipeline only passes newDbasLast90Days: 0; no Crunchbase/job/news data |
| Brevo sync | Implemented | Create contact, duplicate check, list add, attribute map |
| DB schema + views | Implemented | Tables and views as described |
| Cron + report email | Implemented | Optional SMTP summary |

---

## K. Grading-Oriented Summary

**Strengths:**  
- Clear 5-stage pipeline design and README goals.  
- Typed data model (TypeScript + Supabase schema) and sensible views (ready_for_outreach, operators_by_category, category_performance).  
- Config-driven categories and rate limiting.  
- Hunter.io + Brevo integration wired end-to-end for decision makers with email.  
- Run history and optional email report for observability.

**Gaps for grading:**  
1. **Sunbiz:** No real discovery; pipeline starts with 0 candidates, so Stages 1–5 run but produce 0 new operators from “search.”  
2. **Multi-location confirmation:** Designed for 2+ sources; only Google is used, so logic depends on single-source path or DBA override.  
3. **POS/Expansion:** Bonus stage runs but gets no real inputs (no website scrape, no DBA dates, no job/news data).  
4. **Cost tracking:** cost_estimate_usd is a fixed placeholder (5).  
5. **Operators without website:** Never get decision makers; no fallback (e.g. LinkedIn or manual).

**For Claude (grader):**  
- **Who we are targeting:** See the section **"Who we are targeting"** at the top (company segments + decision-maker titles).  
- **Human tasks required:** See **"Human tasks required"** (one-time setup, tuning, ongoing: Supabase/Brevo/API keys, Sunbiz implementation, monitoring, outreach in Brevo, handling operators without website).  
- **What we've done:** See **"What we've done (implementation summary)"** (pipeline, data model, each stage, config, observability, cron, docs).  

Use the rest of the doc (A–K) to verify flow, data model, config, agents, integrations, and implementation vs stub, then apply your rubric.
