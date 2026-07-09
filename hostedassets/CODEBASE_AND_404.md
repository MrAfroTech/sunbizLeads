# Hosted Assets – Codebase Breakdown & 404 Diagnosis

## 1. Codebase breakdown

### This project: `hostedassets`

- **Purpose:** Vercel static deployment for image assets (no app, no API).
- **Config:** `vercel.json` uses `@vercel/static` and serves every file under `**/*`.
- **Contents:**
  - **Root:** `vercel.json`, `.gitignore`, no `index.html` (before fix).
  - **Asset folders (images only):**
    - `customersWaiting/` – multiple `.jpeg` files
    - `frustratedStaffPhotos/` – `.jpeg` and one `.jpg`
    - `dataPhotos/` – multiple `.jpeg` files
  - **Vercel link:** `.vercel/project.json` (project name `hostedassets`); `.vercel` is gitignored.

So the project is **static-only**: no routes, no server, no SPA – just files served as-is.

### How it fits in the monorepo

- **SeamlessMarketplace** is a large repo with many apps:
  - **SeamlessVendorUI** – vendor UI (React, Vercel)
  - **SeamlessCustomerUI** – customer UI + backend
  - **EventBrella/** – ticketing (farmerBanks, ezTickets, etc.)
  - **SeamVentory** – inventory API
  - **aiAgents/** – workflows (lead discovery, speaking, etc.)
  - **wallet-pass-service** – Apple/Google wallet passes
  - **Ticketing/, capitalConnection/, salesMastery/** – other products
- **hostedassets** is one of many Vercel projects; it’s not referenced by name elsewhere in the repo. Other apps use their own `vercel.json` and often use **rewrites** so that `/` or unknown paths serve `index.html` (SPA or landing). This project did not have that.

---

## 2. 404 diagnosis

### Why you get a 404 on “the link”

- **Root link (e.g. `https://<hostedassets-domain>/`):**  
  With `@vercel/static`, the root URL is served by a file at the project root. There was **no `index.html`** (and no rewrites), so requesting `/` had no file to serve → **404**.

- **Any path that isn’t a real file:**  
  Examples: `/link`, `/about`, `/customersWaiting` (if you expect directory listing). Vercel only serves existing files; there are no rewrites to send unknown paths to a fallback page → **404**.

- **Possible filename issues:**  
  Some assets have spaces, e.g. `images (2).jpeg`. URLs must encode spaces as `%20`. If a link uses literal spaces or wrong encoding, the request path won’t match the file → **404**.

### Summary

| Request | Cause of 404 |
|--------|----------------|
| `/` (root) | No `index.html` and no rewrite to a default document |
| `/link` or other non-file path | No such file; no catch-all route |
| URL with unencoded spaces in path | Path doesn’t match actual filename |

---

## 3. Fix applied

- **Root 404:** An **`index.html`** was added in the project root. Visiting `/` now serves this page (e.g. a simple index of asset folders and links to the images).
- **Optional next steps:**  
  - If “the link” is a specific path (e.g. `/link`), you can add a **rewrite** in `vercel.json` to send that path to `index.html` or a specific file.  
  - Ensure any links to assets use correct, encoded URLs (e.g. `%20` for spaces).

After deploying, the root URL should return **200** and show the new index page instead of 404.
