# Jira Ticket Automation

Creates Jira tickets from `tickets.json` for the **Eventbrella Growth Strategy** (or any epic/story/task set you define).

**→ How to structure ticket data:** see **[TICKET_DATA_FORMAT.md](./TICKET_DATA_FORMAT.md)** for the exact JSON format (epics, stories, tasks), field rules, and how to pass ticket info when adding many epics.

## What the script creates

| Type  | Count | Details |
|-------|--------|---------|
| **Epic** | 1 | Eventbrella Growth Strategy |
| **Stories** | 2 | Landing Page Enhancements, Marketing Tactics Execution |
| **Tasks** | 10 | 5 under each story (see `tickets.json`) |

Stories are linked to the epic via the **parent** field. Tasks are linked to their story via the **parent** field.

---

## 1. Get a Jira API token

1. Go to [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
2. Log in with your Atlassian account.
3. Click **Create API token**, give it a label (e.g. "Jira automation"), and copy the token.
4. Store the token somewhere safe; it won’t be shown again.

---

## 2. Copy the environment template

```bash
cp .env.example .env
```

---

## 3. Fill in your environment variables

Edit `.env` and set:

| Variable | Description |
|----------|-------------|
| `JIRA_BASE_URL` | Your Jira site URL, e.g. `https://your-domain.atlassian.net` (no trailing slash) |
| `JIRA_EMAIL` | Email you use to log in to Jira/Atlassian |
| `JIRA_API_TOKEN` | The API token you created in step 1 |
| `JIRA_PROJECT_KEY` | Project key (e.g. `PROJ`, `EB`) where issues will be created |

---

## 4. Install dependencies

```bash
npm install
```

---

## 5. Run the script

```bash
npm run create
```

Or:

```bash
node create-tickets.js
```

The script will create the epic, then each story (linked to the epic), then each task (linked to its story), with short delays between calls. Success messages will print the created issue keys (e.g. `PROJ-1`, `PROJ-2`).

---

## Requirements

- Node.js 18+ (ES modules)
- A Jira Cloud project with issue types **Epic**, **Story**, and **Task**, and hierarchy where stories can have the epic as parent and tasks can have a story as parent.
- If your project uses **Epic Link** instead of **parent** for epic–story linking, the script may need to be updated to set the Epic Link custom field.

---

## Troubleshooting

- **401 Unauthorized**: Check `JIRA_EMAIL` and `JIRA_API_TOKEN`; token must be valid and not revoked.
- **404 / Project not found**: Check `JIRA_BASE_URL` and `JIRA_PROJECT_KEY`.
- **400 Bad Request**: Your project may not support Epic/Story/Task or parent linking as used here; check issue types and hierarchy in Jira project settings.
