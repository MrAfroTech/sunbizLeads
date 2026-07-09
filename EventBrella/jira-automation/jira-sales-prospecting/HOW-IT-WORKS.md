# Jira Automation – A to Z

End-to-end guide to how this automation creates issues in Jira.

---

## A. Prerequisites

- **Node.js 18+** (ES modules)
- **Jira Cloud** project with issue types: Epic, Story, Task (and/or Subtask for story children)
- **Atlassian account** and API token

---

## B. Authentication

1. **Get an API token**  
   [Atlassian → Security → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) → Create → Copy.

2. **Configure `.env`** (copy from `.env.example`):
   - `JIRA_BASE_URL` – Jira site URL, e.g. `https://your-company.atlassian.net` (no trailing slash)
   - `JIRA_EMAIL` – Email you use to log in to Jira/Atlassian
   - `JIRA_API_TOKEN` – The token from step 1
   - `JIRA_PROJECT_KEY` – Project key where issues are created (e.g. `PROJ`, `SCRUM`)

3. **How scripts use it**  
   Scripts load `.env` with `dotenv` and build **Basic auth**:
   ```text
   Authorization: Basic base64(email:apiToken)
   ```
   Every request to Jira REST API v3 includes this header.

---

## C. Ticket data (input)

**Two ways to define what gets created:**

### 1. JSON file (epic + stories + tasks)

- **File:** `tickets.json` (repo root or e.g. `jira-sales-prospecting/tickets.json`).
- **Shape:** Either:
  - **Multiple epics:** `{ "epics": [ { "summary", "description", "stories": [ ... ] } ] }`
  - **Single epic:** `{ "epic": { "summary", "description" }, "stories": [ ... ] }`
- **Hierarchy in JSON:** Epic → Stories → Tasks (each story has a `tasks` array).
- **Fields:** `summary` (required), `description` (optional), `estimate` (optional, e.g. `"2h"`) per task.  
  See **TICKET_DATA_FORMAT.md** in the repo root for full rules.

### 2. Hardcoded in script

- Example: `add-tasks-scrum-128.js` has a `TASKS` array and a fixed `STORY_KEY` (e.g. SCRUM-128).
- Use when you’re only adding subtasks to an **existing** story and don’t need to read from JSON.

---

## D. Descriptions → ADF

Jira Cloud expects **descriptions in Atlassian Document Format (ADF)**, not plain text.

- **Helper:** Every script has a `textToAdf(text)` function.
- **Behavior:** Turns a string into an ADF doc: `{ version: 1, type: "doc", content: [ { type: "paragraph", content: [ { type: "text", text: "…" } ] } ] }`.
- **Usage:** Before calling the API, descriptions are passed through `textToAdf(...)` so Jira accepts them.

---

## E. Jira hierarchy and issue types

- **Epic** – Top-level container. Created with `issuetype: "Epic"`. No parent.
- **Story** – Child of an epic. Created with `issuetype: "Story"` and `parent: { key: epicKey }`.
- **Task vs Subtask** – Depends on project setup:
  - **Task:** Standalone or under Epic; some projects allow Task under Story.
  - **Subtask:** Always under a parent (e.g. Story). If Jira returns “parent does not belong to appropriate hierarchy”, use **Subtask** for work under a Story instead of Task.

Scripts in this repo use **Subtask** when adding items under an existing Story (e.g. `add-tasks-scrum-128.js`).

---

## F. Create-issue flow (single issue)

1. **HTTP:** `POST {JIRA_BASE_URL}/rest/api/3/issue`
2. **Headers:** `Authorization: Basic …`, `Content-Type: application/json`, `Accept: application/json`
3. **Body:**  
   `{ "fields": { "project": { "key": "…" }, "summary": "…", "description": <ADF>, "issuetype": { "name": "Epic"|"Story"|"Task"|"Subtask" }, "parent": { "key": "…" } /* if child */ } }`
4. **Response:** Jira returns the new issue’s `key` (e.g. SCRUM-129). Scripts use this as the parent for children and/or write it to output files.

---

## G. Full run (epic → stories → tasks)

Example: `create-tickets.js` (or `jira-sales-prospecting/create-sales-prospecting.js`):

1. **Read** `tickets.json` and normalize to a list of epics (each with `stories`).
2. **For each epic:**  
   - `createIssue(…, issuetype: "Epic")` → get `epicKey`  
   - Optional `delay(500)` to avoid rate limits.
3. **For each story:**  
   - `createIssue(…, issuetype: "Story", parentKey: epicKey)` → get `storyKey`  
   - Delay.
4. **For each task/subtask under that story:**  
   - `createIssue(…, issuetype: "Task" or "Subtask", parentKey: storyKey)`  
   - Delay.
5. **Log** each created key; some scripts also **write** keys and summary to JSON/log in a subfolder (e.g. `jira-sales-prospecting/created-issues.json`, `run.log`).

---

## H. Delays

- Scripts use a short **delay** (e.g. 500 ms) between API calls to reduce the chance of rate limiting or transient errors.
- Constant: `DELAY_MS = 500` (or similar) in each script.

---

## I. Output (where results go)

- **Console:** Every script logs what it creates (e.g. “Created SCRUM-129 – M Woods”).
- **Files (e.g. Sales Prospecting):**
  - `created-issues.json` or `created-tasks-scrum-128.json` – epic key, story key, list of task/subtask keys and summaries, timestamp, and on failure an `error` field.
  - `run.log` or `run-add-tasks.log` – same lines as console, so you have a persistent log.

---

## J. How to run

- **From repo root (`jira-automation`):**
  - Full ticket set from root `tickets.json`:  
    `npm run create` or `node create-tickets.js`
  - Sales Prospecting epic + story + tasks from JSON:  
    `npm run create-sales-prospecting` or `node jira-sales-prospecting/create-sales-prospecting.js`
  - Only add the four lead subtasks to SCRUM-128:  
    `node jira-sales-prospecting/add-tasks-scrum-128.js`
- **Requirement:** `.env` must exist in `jira-automation` with the four Jira variables set.

---

## K. Summary diagram

```text
.env (JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY)
    ↓
tickets.json OR hardcoded TASKS + STORY_KEY
    ↓
Script (create-tickets.js / create-sales-prospecting.js / add-tasks-scrum-128.js)
    ↓
For each issue: textToAdf(description) → POST /rest/api/3/issue → delay
    ↓
Jira creates Epic → Story → Task/Subtask (with parent links)
    ↓
Console log + optional JSON + log file in jira-sales-prospecting/
```

That’s the A–Z of how this automation works.
