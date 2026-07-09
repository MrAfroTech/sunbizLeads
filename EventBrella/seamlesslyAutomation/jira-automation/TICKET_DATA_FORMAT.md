# Ticket Data Format

This document defines how to structure ticket data for the Jira automation script. Use this format when editing `tickets.json` or when asking for new tickets to be added (e.g. in chat): provide data in this structure and it can be dropped into `tickets.json` or merged with existing content.

---

## Hierarchy

- **Epic** (top level) → **Story** (child of epic) → **Task** (child of story)
- Each epic can have many stories; each story can have many tasks.
- You can have one epic or many epics in a single `tickets.json`.

---

## Format 1: Multiple epics (recommended for “a bunch”)

Use an **`epics`** array when you have several epics. Each epic has its own **`stories`**; each story has its own **`tasks`**.

```json
{
  "epics": [
    {
      "summary": "Epic title (required)",
      "description": "Epic description (optional but recommended)",
      "stories": [
        {
          "summary": "Story title (required)",
          "description": "Story description (optional)",
          "tasks": [
            {
              "summary": "Task title (required)",
              "description": "Task description (optional)",
              "estimate": "2h"
            }
          ]
        }
      ]
    }
  ]
}
```

### Field rules

| Level   | Field         | Required | Description |
|---------|---------------|----------|-------------|
| **Epic** | `summary`     | Yes      | Short title (e.g. "Eventbrella Growth Strategy"). |
| **Epic** | `description` | No       | Plain text; used as the epic’s description in Jira. |
| **Epic** | `stories`    | Yes      | Array of story objects. Can be `[]` for an epic with no stories yet. |
| **Story** | `summary`    | Yes      | Short title (e.g. "Landing Page Enhancements"). |
| **Story** | `description`| No       | Plain text; used as the story’s description in Jira. |
| **Story** | `tasks`      | No       | Array of task objects. Can be `[]` or omitted. |
| **Task**  | `summary`    | Yes      | Short title (e.g. "Add Kia Center case study to homepage"). |
| **Task**  | `description`| No       | Plain text; used as the task’s description in Jira. |
| **Task**  | `estimate`   | No       | Time estimate. See [Task estimates](#task-estimates) below. |

### Task estimates

- **Jira time tracking:** Use a string like `"1h"`, `"2h"`, `"4h"`, `"30m"`. The script sends this as `originalEstimate` and `remainingEstimate` when creating the issue. Only these formats set Jira’s time tracking.
- **No estimate:** Omit `estimate` or use `""`.
- **Labels only (no time):** Use `"ongoing"`, `"daily"`, or any other label. The script does **not** send these to Jira time tracking; put the same wording in `description` if you want it visible (e.g. “Daily/ongoing: …”).

### Example: two epics, multiple stories and tasks

```json
{
  "epics": [
    {
      "summary": "Eventbrella Growth Strategy",
      "description": "Increase platform visibility and adoption.",
      "stories": [
        {
          "summary": "Landing Page Enhancements",
          "description": "Site improvements to convert visitors.",
          "tasks": [
            {
              "summary": "Add Kia Center case study to homepage",
              "description": "Add case study and logo to build credibility.",
              "estimate": "2h"
            },
            {
              "summary": "Add Book a Demo CTAs",
              "description": "Place CTAs across key pages.",
              "estimate": "2h"
            }
          ]
        }
      ]
    },
    {
      "summary": "Q2 Integrations",
      "description": "Integrate with payment and CRM systems.",
      "stories": [
        {
          "summary": "Stripe integration",
          "description": "Accept payments via Stripe.",
          "tasks": [
            {
              "summary": "Implement Stripe Checkout",
              "description": "Add Stripe Checkout for ticket purchases.",
              "estimate": "8h"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Format 2: Single epic (legacy)

For one epic only, you can use **`epic`** (object) and **`stories`** (array) at the root. The script accepts this and treats it as one epic.

```json
{
  "epic": {
    "summary": "Epic title (required)",
    "description": "Epic description (optional)"
  },
  "stories": [
    {
      "summary": "Story title (required)",
      "description": "Story description (optional)",
      "tasks": [
        {
          "summary": "Task title (required)",
          "description": "Task description (optional)",
          "estimate": "2h"
        }
      ]
    }
  ]
}
```

Field rules are the same as in Format 1; only the top-level shape is different (`epic` + `stories` instead of `epics`).

---

## How to pass ticket info (e.g. in chat)

When you want to add or change tickets, you can:

1. **Paste JSON** in this format (either `epics` array or single `epic` + `stories`), or  
2. **Describe in structure** and ask for the JSON, for example:

- “Add an epic ‘X’ with two stories: ‘A’ (tasks: …) and ‘B’ (tasks: …).”
- “Add a new story under the existing epic ‘Eventbrella Growth Strategy’: summary ‘…’, description ‘…’, and tasks: [list with summary, description, estimate].”

Then:

- For **replacement:** replace the contents of `tickets.json` with the new JSON.
- For **adding:** merge the new epic(s) or story(asks) into the existing `epics` (or `epic`/`stories`) in `tickets.json` so the file stays valid and the script can run.

---

## Summary

| You want…              | Use in `tickets.json`                          |
|------------------------|------------------------------------------------|
| One epic               | `epic` + `stories` (Format 2) or one item in `epics` (Format 1). |
| Many epics             | `epics` array (Format 1).                      |
| Stories under an epic  | Each epic has a `stories` array.               |
| Tasks under a story    | Each story has a `tasks` array.                |
| Time in Jira           | Task `estimate` like `"1h"`, `"2h"`, `"30m"`. |
| “Ongoing” / “Daily”    | Put in task `description`; `estimate` can be `"ongoing"` or `"daily"` (no Jira time tracking). |

Keep **summary** and **description** as plain text; the script converts descriptions to Jira’s Atlassian Document Format when creating issues.
