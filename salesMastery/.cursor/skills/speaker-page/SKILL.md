---
name: speaker-page
description: >-
  Static speaker microsite under salesMastery/speakerPage (Maurice Sanders /
  Seamlessly). Use when the user mentions speakerPage, /speakerPage, speaker
  page, or Vercel project speaker-page. Enforces scope to that folder only —
  not aiAgents, not other salesMastery apps. Covers public/ layout, vercel.json,
  and Git + Vercel root-directory requirements.
---

# Speaker page (`salesMastery/speakerPage`)

## Scope (non-negotiable)

- **Work only inside** `salesMastery/speakerPage/` unless the user explicitly asks to change repo-wide or Vercel dashboard settings.
- **Do not** fold this into `aiAgents/`, reuse aiAgents workflows here, or treat the monorepo as “one codebase” for this task. The speaker site is a **small static HTML** project; `aiAgents` is unrelated unless the user says otherwise.

## What this project is

- **Type**: Static site; Vercel serves **`public/`** as the site root (`outputDirectory` in `vercel.json`).
- **Package**: `seamlessly-speaker-page`; `npm run build` is a no-op (`true`) — assets live in `public/` as-is.
- **Entry URLs** (after deploy):
  - `/` → `public/index.html` (redirects to `/speaker/`)
  - `/speaker/` → `public/speaker/index.html` (main page)
  - `/speaker` → permanent redirect to `/speaker/` (see `vercel.json`)

## File map

| Path | Role |
|------|------|
| `public/speaker/index.html` | Primary speaker landing page |
| `public/index.html` | Root redirect to `/speaker/` |
| `public/speaker.html` | Alternate entry if linked |
| `vercel.json` | Build/output, trailing slash, `/speaker` redirect |
| `package.json` | Project name + build script |

## Vercel (Git-connected)

- **Root Directory** in the Vercel project must be **`salesMastery/speakerPage`** when the Git repo is the parent monorepo (e.g. SeamlessMarketplace). Otherwise the deployment will not pick up this `vercel.json` or `public/`.
- **Git**: Everything served in production must exist **on the remote branch** Vercel builds from. Untracked-only files on a laptop do not deploy — that manifests as `404 NOT_FOUND` on the live URL.

## Agent workflow

1. **Edits**: Change HTML/CSS/inline assets under `public/` (and `vercel.json` / `package.json` only when needed).
2. **Verify locally**: Open `public/speaker/index.html` in a browser or run a static server from `public/` if the user wants a quick check.
3. **Deploy path**: Remind the user to commit **`salesMastery/speakerPage/**`** and push when they use Git integration; do not assume other folders are part of this site.
4. **Avoid**: Suggesting moves into `aiAgents/`, sharing env or scripts from aiAgents, or editing unrelated packages “while we’re here.”

## If the user says “404”

- Confirm the **exact URL** (host + path). Valid content is at **`/`** and **`/speaker/`**, not arbitrary paths like `/speakerPage` unless explicitly routed.
- Confirm Vercel **Root Directory** and that **`salesMastery/speakerPage`** (including `public/`) is on the branch being deployed.
