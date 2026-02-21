# A–Z: State Jobs (AL, GA, FL) + Why Florida Might Return No Leads

## 1. What each workflow runs

| Workflow | Schedule | What runs |
|----------|----------|-----------|
| **FL Sunbiz Daily** (`sunbiz-daily.yml`) | Mon–Fri 9:00 AM EST (`0 14 * * 1-5`) | `runEstablished.js --state FL` then `runNewBiz.js --state FL` |
| **GA SoS** (`ga-daily.yml`) | Tue 9:30 AM EST (`30 14 * * 2`) | `runEstablished.js --state GA` then `runNewBiz.js --state GA` |
| **AL SoS** (`al-daily.yml`) | Wed 10:00 AM EST (`0 15 * * 3`) | `runEstablished.js --state AL` then `runNewBiz.js --state AL` |

All three use the same secrets: `SUNBIZ_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT`. No other env (e.g. no Places key).

---

## 2. What each job does (step by step)

### Layer 1 — Established (`runEstablished.js`)

1. **Input:** `--state FL | GA | AL`.
2. **Get existing names:** `getExistingNames('Est-Live')` → reads column A of the Est-Live sheet so we don’t duplicate.
3. **Scrape:** `scrapeEstablished(STATE)` → returns raw entities (name, entityName, filingDate, status, physicalAddress, etc.).
4. **Dedup:** `dedup(raw, existingNames)` → drop any entity whose `name` is already in the Est-Live name set.
5. **Score:** each entity gets `scoreEntity(e, 'est')` (see criteria below).
6. **Qualify:** keep only entities with `score >= 60`.
7. **Write:** `appendToSheet('Est-Live', qualified)` → append rows to the Est-Live tab.

**Criteria (Layer 1 — Established):**

- **Source of data:** Only FL is implemented. GA and AL call the same scraper but it returns `[]` (see below).
- **Scraper (FL only):**  
  - Request: `GET https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?SearchTerm=restaurant+OR+group+OR+holdings+OR+concepts&SearchType=EntityName&SearchStatus=A`  
  - Parse HTML with cheerio: look for `table.search-results tr` (fallback: any `table tr`), expect 5 columns: entityName, entityId, status, filingDate, physicalAddress.
  - Keep only: `status === 'ACTIVE'`, `filingDate >= 2020-01-01`, `physicalAddress` present and not containing `"PO BOX"`.
- **Scoring (qualify.js, layer `'est'`):**  
  - Base 50.  
  - Recency: filing ≤6mo +20, ≤12mo +12, ≤18mo +6.  
  - Locations ≥5 +20, ≥3 +12; dbaCount > 1 +8.  
  - No physicalAddress −20; status !== 'ACTIVE' −30.  
  - (Note: with no Places enrichment, `locations` is always defaulted to 1 in the pipeline, so the “locations” bumps rarely apply.)
- **Final filter:** score ≥ 60.

### Layer 2 — New biz (`runNewBiz.js`)

1. **Input:** `--state FL | GA | AL`, fixed `KEYWORDS = ['tavern','lodge','eatery','lounge','bistro','inn','bar','grill']`, and `CUTOFF` = 18 months ago.
2. **Get existing names:** `getExistingNames('New-Live')` → column A of New-Live.
3. **Scrape:** `scrapeNewBiz(STATE, KEYWORDS, CUTOFF)`.
4. **Dedup** by existing names.
5. **Score** with `scoreEntity(e, 'new')`.
6. **Qualify:** keep only `score >= 52`.
7. **Write:** `appendToSheet('New-Live', qualified)`.

**Criteria (Layer 2 — New biz):**

- **Source of data:** Again only FL is implemented; GA/AL return `[]`.
- **Scraper (FL only):**  
  - Request: same base URL with `SearchTerm=<keywords joined by space>`, `SearchType=EntityName`, `SearchStatus=A`, `DateFrom=<CUTOFF YYYY-MM-DD>`.  
  - Same HTML parsing and column mapping.  
  - Keep: filingDate ≥ CUTOFF, ACTIVE, physicalAddress and no PO BOX, and entity name contains at least one of the keywords (case-insensitive).
- **Scoring (layer `'new'`):**  
  - Base 50, same recency as above; age ≤3mo +15; has physicalAddress +10; locations === 1 +8; no physicalAddress −20; not ACTIVE −30.  
- **Final filter:** score ≥ 52.

---

## 3. Alabama and Georgia jobs — why they return no leads

In `scripts/sunbizScraper.js`:

- **`scrapeEstablished(state)`:**  
  - If `state !== 'FL'` it **immediately returns `[]`**.  
  - So for **GA and AL**, the established scrape always returns zero raw entities.
- **`scrapeNewBiz(state, keywords, cutoff)`:**  
  - If `state !== 'FL'` it **immediately returns `[]`**.  
  - So for **GA and AL**, the new-biz scrape also always returns zero raw entities.

So:

- **Alabama job:** Runs the same pipeline as FL, but both Layer 1 and Layer 2 get **no data** from the scraper → 0 qualified → nothing appended. No bug in the pipeline; the AL (and GA) **scraper is not implemented** (stubbed to empty).
- **Georgia job:** Same: no GA-specific SoS URL or HTML parsing, so both layers get 0 raw entities → 0 leads.

To get real AL/GA leads you’d need to implement `scrapeEstablished('GA')` / `scrapeNewBiz('GA', ...)` and the same for AL, using the real Georgia Secretary of State and Alabama Secretary of State corporation search URLs and their HTML (or API) and map to the same entity shape (entityName, filingDate, status, physicalAddress, etc.).

---

## 4. Why Florida Sunbiz daily scrape might return no leads

Possible causes, in order of likelihood:

### 4.1 Scraper returns no rows (HTML / URL / params)

- **URL/params mismatch:**  
  The code uses query params like `SearchTerm`, `SearchType`, `SearchStatus`, `DateFrom`. The real Florida Sunbiz site may use different names (e.g. `InquiryType`, `inquiryDirectionType`, etc.). If the server ignores our params, the response might be empty or a “no results” page, so the parser gets no rows.
- **HTML structure mismatch:**  
  Parser expects:
  - A table with class `search-results` (or fallback: any table).
  - Rows with at least 5 `<td>`s: [0]=name, [1]=id, [2]=status, [3]=filing date, [4]=physical address.  
  If the live site uses different classes, different table layout, or different column order (e.g. only 3 columns: name, document number, status), then:
  - `table.search-results` might not exist → fallback table might have different column meanings.
  - Or the “filing date” and “physical address” columns might be missing or in other columns → we’d capture wrong data or empty strings, and later filters would drop them.
- **No “search results” table:**  
  Some flows (e.g. by-name search) might return a different page (e.g. form or detail view) with no results table → `parseSunbizHTML` returns `[]`.
- **Blocking / redirect:**  
  If the server blocks or redirects (e.g. bot detection, different URL for non-browser), `fetch` could get an error page or empty body → again no rows.

So “no leads” can simply mean: **the HTTP request doesn’t return HTML that matches the current parser and column assumptions.**

### 4.2 All rows filtered out before scoring

Even if the parser returns rows:

- **Status:** Only `ACTIVE` is kept; anything else (INACT, RPEND/UA, etc.) is dropped.
- **Filing date:**  
  - Layer 1: must be ≥ 2020-01-01.  
  - Layer 2: must be ≥ CUTOFF (18 months ago).  
  If the site returns dates in an unexpected format, `new Date(e.filingDate)` could be Invalid Date and the date filter would drop the row.
- **Address:** Rows without `physicalAddress` or with `"PO BOX"` are removed. If the parser puts address in a different column or the site doesn’t show it, everything gets dropped here.

So a second class of “no leads” is: **parser output exists but every row fails status/date/address filters.**

### 4.3 All rows removed by dedup

If the sheet already has many names, `dedup(raw, existingNames)` removes any entity whose name is already in Est-Live or New-Live. So even with a working scrape, you could see **0 new** leads if every raw entity is already in the sheet.

### 4.4 Score threshold

- Layer 1: score ≥ 60; Layer 2: score ≥ 52.  
- With **no Places enrichment**, `locations` is effectively 1 and `dbaCount` is 0, so established entities don’t get the “multi-location” or “multi-DBA” bonuses. That can keep scores below 60 for Layer 1 even when the rest of the data is fine. So **all entities could be below threshold** and get dropped at the “qualified” step.

### 4.5 Sheet / auth

- If `appendToSheet` or `getExistingNames` fails (e.g. wrong sheet ID, not shared with service account, or auth failure), the run could error before you see any “qualified” count, or you might see a count but no new rows. That’s an environment/permissions issue, not “scraper returns data but we filter it all.”

---

## 5. Summary table

| Job | What it does | Why it might give 0 leads |
|-----|----------------|----------------------------|
| **AL (Est + New)** | Same pipeline as FL with `--state AL`. | **Scraper is stubbed:** `scrapeEstablished('AL')` and `scrapeNewBiz('AL', ...)` both return `[]`. No AL SoS implementation. |
| **GA (Est + New)** | Same pipeline as FL with `--state GA`. | **Scraper is stubbed:** same as AL; no GA SoS implementation. |
| **FL (Est)** | Fetch FL Sunbiz by name (restaurant/group/holdings/concepts), parse table, filter ACTIVE + 2020+ + no PO BOX, dedup, score (est), keep ≥60, append to Est-Live. | 1) Sunbiz URL/params or HTML don’t match (no/empty table or wrong columns). 2) All rows filtered out by status/date/address. 3) All deduped. 4) All below score 60 (e.g. no locations bonus). 5) Sheet/auth failure. |
| **FL (New)** | Same site, keywords + DateFrom, same parse/filter, dedup, score (new), keep ≥52, append to New-Live. | Same as FL Est, plus: DateFrom/params might not be supported or might return nothing; keyword filter might remove all rows; score 52 threshold. |

---

## 6. How to confirm where it breaks (FL)

1. **Log raw count:** In `runEstablished.js` / `runNewBiz.js`, log `raw.length` right after `scrapeEstablished(STATE)` / `scrapeNewBiz(...)`. If it’s 0, the problem is URL/params or HTML parsing (or Sunbiz blocking).
2. **Log after filters:** In `sunbizScraper.js`, after the `.filter(...)` chain, log the array length. If raw > 0 but this is 0, the issue is status/filingDate/physicalAddress or keyword (new) filters.
3. **Log after dedup:** Log `deduped.length`. If that’s 0 but “after filters” is > 0, everything is already in the sheet.
4. **Log scores:** Log `scored.length` and e.g. `scored.filter(e => e.score >= 60).length`. If qualified is 0 but deduped > 0, the score threshold or scoring logic (e.g. no locations) is killing all rows.
5. **Inspect HTML:** Save the response body of `fetch(url)` to a file (e.g. in CI) and inspect the real table structure and param names the site uses so the parser and URL can be aligned with the live site.

This document is diagnosis only; no code changes were made.
