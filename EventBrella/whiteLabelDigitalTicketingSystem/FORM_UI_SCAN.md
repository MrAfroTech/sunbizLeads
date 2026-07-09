# White-Label Form UI Scan

**Scope:** The **onboarding form** that generates the Cursor instruction (client config → prompt). **Not** the ticketing site UI that gets created from that prompt.

---

## Entry point

- **File:** `white-label-form.html`
- **Logic:** `prompt-template.js` (builds the prompt from form data)

---

## Visual design

- **Theme:** Dark with gold accent (“EventBrella” style)
  - Background: near-black (`#0a0a0a`) with subtle radial gold gradients
  - Accent: gold palette (`#d4af37`, `#f8e8a0`, `#b8860b`)
  - Cards: `bg-black/40`, `backdrop-blur`, `border border-eb-gold/20`
- **Typography:** Montserrat (body), Playfair Display (headings)
- **Layout:** Single column, `max-w-4xl` centered, generous padding

---

## Form structure (accordion sections)

1. **Identity & Branding** – Client name, display name, event name, date (native date picker), start/end time (30‑min dropdowns), event description. Note: images live in section 5.
2. **Venue & Location** – Venue name, address lines, phone. Google Maps URLs derived from address when generating the prompt.
3. **Contact & Web** – Website URL, contact email.
4. **Ticketing Tiers** – Dynamic “+ Add Tier” cards: name, id/slug, price, capacity, description; each card has “Remove Tier.”
5. **Images (by UI location)** – One block per UI slot (organizer photo, hero background, event poster, about left/right). Each: file upload + optional URL/path, short description of where it appears on the site.
6. **Config / Env (Summary)** – Read-only summary of key env vars (ORGANIZER_NAME, BASE_URL, venue, etc.) driven by form data.

**Accordion behavior:** One panel open at a time; choice persisted in `localStorage`; trigger shows ▼/▲.

---

## Header actions (above the form)

- **Save draft** – `localStorage` (JSON)
- **Load draft** – Restore from `localStorage`
- **Clear form** – Confirm then reset
- **Pre-fill example** – Fills from `window.exampleClientData`
- **Import JSON** – File input, replaces form state
- **Export JSON** – Download current form data as JSON

---

## Submit and output

- **Primary CTA:** “Submit form → Generate prompt” – scrolls to preview, briefly highlights it.
- **Preview block:** “Generated Cursor instruction” – live-updating `<pre>` (prompt text). Updates on input/change.
- **Preview actions:**
  - **Copy to clipboard**
  - **Download .txt** – Filename from client name + `-cursor-instruction.txt`
  - **Save & bashagent** – Downloads same .txt and copies `bashagent chat "$(cat /path/to/...)"` to clipboard
  - **Preview mode** – Modal with full prompt (same content, easier to read)

---

## UX details

- **Tooltips:** `[data-tooltip]` on hover (e.g. on some labels).
- **File inputs:** After choosing a file, its name is shown under the input (organizer + four image slots).
- **Event time:** Hidden field `CLIENT_EVENT_TIME` composed from start/end dropdowns; on load draft/example, “9:00 AM - 11:00 AM” is parsed back into the two dropdowns.
- **Config summary:** Section 6 updates as Identity/Venue (and related) fields change; labels in gold, values inline.
- **Dynamic tiers:** Cards use `.dynamic-card` (border, rounded, dark bg); remove per card; tier count tracked in `ticketingTiersCount`.

---

## Technical stack (form only)

- **Tailwind CSS** (CDN) with custom `eb` theme (colors, fonts).
- **Vanilla JS** in a single IIFE: no framework.
- **Dependencies:** `prompt-template.js` (must define `window.buildCursorPrompt(data)` and optionally `window.exampleClientData`).

---

## What makes it “really nice”

- **Single-page, no backend:** Everything runs in the browser; draft/export/import and prompt generation are client-side.
- **Progressive disclosure:** Accordion keeps the form scannable; only one section expanded at a time.
- **Live preview:** Prompt updates as you type; no separate “generate” step to see the result.
- **Multiple export paths:** Copy, download .txt, or “Save & bashagent” with a ready-to-edit command.
- **Draft and portability:** Save/load draft (localStorage) and Import/Export JSON so config can be moved or versioned.
- **Clear image mapping:** Section 5 labels each image by where it appears on the site (e.g. “Venue section”, “Hero section”, “About/Events left photo”).
- **Consistent dark+gold UI:** Cohesive, readable, and on-brand for the product.

---

## Files involved (form UI only)

| File | Role |
|------|------|
| `white-label-form.html` | Full form UI, inline scripts, Tailwind config, styles |
| `prompt-template.js` | `buildCursorPrompt(data)`, example data, prompt text |

No separate CSS file; all form styling is in the HTML (Tailwind + `<style>` block).
