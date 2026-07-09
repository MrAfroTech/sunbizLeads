# Playwright Automation (Staff Page Selector Debugger)

This folder is a **drop-in Playwright + Express** tool that helps you quickly determine which DOM selectors reliably represent “staff cards” on a live team/venue staff page.

It gives you a **local UI** (Seamlessly Navy/Gold/Teal) where you paste a URL, click **Analyze**, and see:
- likely repeating card selectors (ranked)
- counts
- a few example nodes (text + size)

When you test on a live staff page, send me the **top selector** you see and whether it captures the fields you care about (name/title/email/phone/photo). We’ll tune extraction rules per team site as needed.

---

## Project setup

### Requirements
- Node.js 18+ (recommended)
- macOS is fine

### Install

From this folder:

```bash
cd "/Users/missioncontrol/SeamlessMarketplace/salesMastery/playwrightAutomation"
npm install
npm run install:browsers
```

Notes:
- `install:browsers` installs **Chromium** for Playwright (and dependencies).

---

## Run it

```bash
npm run dev
```

Then open:
- `http://localhost:3177`

---

## What it does

### UI
- `index.html`: URL input + Analyze button + ranked selector list.

### Server
- `server.js`:
  - `GET /` serves `index.html`
  - `POST /api/analyze` launches Playwright Chromium, loads the URL, scrolls a bit for lazy content, and returns ranked candidate selectors.

Ranking is intentionally simple:
- **repeatability** (same selector matches many elements)
- **class/text hints** (contains words like staff/team/card/coach/directory/bio/profile)

---

## Output you should send back after testing

For a given staff page URL, send:
- **URL**
- **Top selector** (rank #1)
- **Count**
- **Whether examples include**:
  - name
  - title
  - email/phone (if present)
  - photo (img)

If the selector list is empty or wrong, tell me what the page is doing (SPA, infinite scroll, inside an iframe, etc.) and we’ll adjust the strategy.

---

## Common issues

### It works locally but returns “0 cards”
- The staff list might be loaded only after deeper scrolling, a click, or on an iframe.
- Some sites block headless browsers. If that happens, we can add a `headless:false` toggle (already supported by the API if you post it manually).

### CORS / missing images
This tool is only using the DOM to rank selectors. Images don’t need to load for the selector output to be useful.

