# Sales Prospecting – Jira automation

Creates the **Sales Prospecting** epic with one story and four lead tasks in Jira.

## Hierarchy

- **Epic:** Sales Prospecting  
- **Story:** Semi Pro Engaged Leads  
- **Tasks:** M Woods, Darren Newsome, Jeff Jarnigan, Ted Tornow  

## Files

| File | Purpose |
|------|--------|
| `tickets.json` | Epic, story, and task definitions (edit to add/change leads). |
| `create-sales-prospecting.js` | Script that creates the issues and writes output to this folder. |
| `created-issues.json` | Written after a run: epic key, story key, task keys, and summary. |
| `run.log` | Written after a run: full console log. |

## How to run

From the **jira-automation** root (parent of this folder):

```bash
node jira-sales-prospecting/create-sales-prospecting.js
```

Or:

```bash
npm run create-sales-prospecting
```

Ensure `.env` exists in **jira-automation** with `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_PROJECT_KEY`.

## Output

After a successful run you get:

- **created-issues.json** – e.g. `epic`, `story`, `tasks` (array of `{ key, summary }`), `summary` counts, `createdAt`.
- **run.log** – same lines that were printed to the console.

Errors are also written to these files before exiting.
