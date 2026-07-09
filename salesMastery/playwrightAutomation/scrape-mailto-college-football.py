#!/usr/bin/env python3
"""
Scrape visible contact info (name, title, email, phone) from a staff/directory URL.
Everything is read from rendered text and attributes — no mailto clicks, clipboard,
navigation interception, or hunting in onclick/hidden handlers. Appends rows to
contactDataApril2026.csv.

Usage: python scrape-mailto-college-football.py <url> <company>
"""

import argparse
import csv
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
CSV_PATH = SCRIPT_DIR / "contactDataApril2026.csv"
CSV_HEADERS = ["Name", "Title", "Company", "Email", "Phone"]

# Scroll top-to-bottom to trigger lazy-loaded content (async so Playwright waits)
SCROLL_JS = r"""
async () => {
  const step = 400;
  const pause = 100;
  const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  for (let y = 0; y <= max; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, pause));
  }
  window.scrollTo(0, 0);
}
"""

# Open checkbox accordions and <details> so directory rows appear in the DOM.
EXPAND_COLLAPSED_JS = r"""
() => {
  let opened = 0;
  document.querySelectorAll('input.p-accordion__actual-checkbox[type="checkbox"]').forEach(cb => {
    if (!cb.checked) {
      cb.checked = true;
      cb.dispatchEvent(new Event('input', { bubbles: true }));
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      opened++;
    }
  });
  document.querySelectorAll('details:not([open])').forEach(d => {
    const s = d.querySelector(':scope > summary');
    if (s) {
      try { s.click(); opened++; } catch (e) {}
    }
  });
  return opened;
}
"""

# Structured staff cards: name / title / phone / email read from each card (BC-style layouts).
EXTRACT_VISIBLE_CONTACTS_JS = r"""
() => {
  const emailReGlobal = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const emailReOne = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const results = [];
  const seen = new Set();

  function textOf(el) {
    if (!el) return '';
    return el.innerText.replace(/\s+/g, ' ').trim().slice(0, 8000);
  }

  function looksLikeSectionHeading(t) {
    const s = (t || '').trim();
    if (!s) return true;
    return /^(the\s+)?(football\s+|men'?s\s+|women'?s\s+)?(coaching\s+)?(staff|roster|directory)$/.test(s)
      || /^meet\s+the\s+/i.test(s)
      || /^(\d+\s+)?(full\s*)?(staff|directory|coaches)$/i.test(s);
  }

  function isPhoneish(s) {
    const t = (s || '').trim();
    if (!t) return false;
    if (/@/.test(t)) return true;
    if (/\b\d{3}-\d{4}\b/.test(t)) return true;
    if (/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/.test(t)) return true;
    const digits = t.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15 && !/[a-zA-Z]{4,}/.test(t)) return true;
    return false;
  }

  function extractPhoneFromRoot(root) {
    if (!root || !root.querySelector) return '';
    const tel = root.querySelector('a[href^="tel:"], a[href^="TEL:"]');
    if (tel) {
      const raw = (tel.getAttribute('href') || '').replace(/^tel:/i, '').trim();
      try {
        const decoded = decodeURIComponent(raw);
        const cleaned = decoded.replace(/[^\d+()\-.\s]/g, '').trim();
        if (cleaned.replace(/\D/g, '').length >= 7) return cleaned.slice(0, 40);
      } catch (e) {}
    }
    const text = (root.innerText || '').replace(/\s+/g, ' ');
    const fullRe = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
    let pm;
    fullRe.lastIndex = 0;
    while ((pm = fullRe.exec(text)) !== null) {
      const cand = pm[0].trim();
      if (cand.replace(/\D/g, '').length >= 10) return cand.slice(0, 40);
    }
    const shortRe = /\b\d{3}-\d{4}\b/g;
    shortRe.lastIndex = 0;
    while ((pm = shortRe.exec(text)) !== null) {
      return pm[0].trim().slice(0, 40);
    }
    return '';
  }

  function extractEmail(card) {
    const mailto = card.querySelector('a[href^="mailto:"]');
    if (mailto) {
      const mm = (mailto.getAttribute('href') || '').match(/mailto:([^?&]+)/i);
      if (mm) {
        try {
          const e = decodeURIComponent(mm[1].trim());
          if (e.includes('@')) return e;
        } catch (e) {}
      }
    }
    const blob = textOf(card);
    const m = blob.match(emailReOne);
    return m ? m[0] : '';
  }

  function extractName(card) {
    for (const tag of ['h2', 'h3', 'h4']) {
      const h = card.querySelector(tag);
      if (h) {
        const t = textOf(h).slice(0, 80);
        if (t && !t.includes('@') && !looksLikeSectionHeading(t)) return t;
      }
    }
    const nameish = card.querySelector('[class*="name"], [class*="Name"]');
    if (nameish) {
      const t = textOf(nameish).slice(0, 80);
      if (t && !t.includes('@') && !looksLikeSectionHeading(t)) return t;
    }
    return '';
  }

  function extractTitle(card, name) {
    const nodes = card.querySelectorAll('p, span');
    for (const n of nodes) {
      const t = textOf(n).trim();
      if (!t || t.length > 240) continue;
      if (t.includes('@')) continue;
      if (isPhoneish(t)) continue;
      if (name && t === name.trim()) continue;
      if (looksLikeSectionHeading(t)) continue;
      if (/^e[\s.-]*mail/i.test(t)) continue;
      return t.slice(0, 80);
    }
    return '';
  }

  function pushRow(email, name, title, phone) {
    const k = (email || '').toLowerCase();
    if (!email || !email.includes('@') || seen.has(k)) return;
    seen.add(k);
    results.push({
      email,
      name: (name || '').slice(0, 80),
      title: (title || '').slice(0, 80),
      phone: (phone || '').slice(0, 40),
    });
  }

  const cardSel = [
    '[class*="s-person"]',
    '[class*="staff-card"]',
    '[class*="contact-card"]',
    '[class*="StaffMember"]',
    'article',
    'li[class*="staff"]',
    'li[class*="member"]',
    'div[class*="person"]',
    'div[class*="bio"]',
    'div[class*="coach"]',
  ].join(', ');

  const cards = document.querySelectorAll(cardSel);

  if (cards.length === 0) {
    const bodyText = textOf(document.body);
    let m;
    emailReGlobal.lastIndex = 0;
    const phoneFallback = extractPhoneFromRoot(document.body);
    while ((m = emailReGlobal.exec(bodyText)) !== null) {
      pushRow(m[0], '', '', phoneFallback);
    }
    return results;
  }

  cards.forEach(card => {
    const email = extractEmail(card);
    if (!email) return;
    const name = extractName(card);
    const title = extractTitle(card, name);
    const phone = extractPhoneFromRoot(card);
    pushRow(email, name, title, phone);
  });

  return results;
}
"""


def _dedupe_rows(rows: list[dict]) -> list[dict]:
    deduped_map: dict[str, dict] = {}
    for r in rows:
        key = (r.get("Email") or "").strip().lower()
        if not key:
            continue
        if key not in deduped_map:
            deduped_map[key] = dict(r)
            continue
        existing = deduped_map[key]
        new_phone = (r.get("Phone") or "").strip()
        old_phone = (existing.get("Phone") or "").strip()
        if new_phone and not old_phone:
            existing["Phone"] = new_phone
        if (r.get("Name") or "").strip() and not (existing.get("Name") or "").strip():
            existing["Name"] = r.get("Name", "")
        if (r.get("Title") or "").strip() and not (existing.get("Title") or "").strip():
            existing["Title"] = r.get("Title", "")
    return list(deduped_map.values())


def _rows_from_extract_raw(raw: list) -> list[dict]:
    return [
        {
            "Name": (r.get("name") or "").strip(),
            "Title": (r.get("title") or "").strip(),
            "Email": (r.get("email") or "").strip(),
            "Phone": (r.get("phone") or "").strip()[:40],
        }
        for r in raw
        if r.get("email")
    ]


def _expand_collapsed_sections(
    page,
    started: float,
    wall_seconds: float,
    max_rounds: int,
) -> None:
    if max_rounds <= 0:
        return
    for _ in range(max_rounds):
        if (time.monotonic() - started) >= wall_seconds:
            break
        try:
            opened = int(page.evaluate(EXPAND_COLLAPSED_JS) or 0)
        except Exception:
            break
        if opened <= 0:
            break
        page.wait_for_timeout(400)
    try:
        page.evaluate(SCROLL_JS)
    except Exception:
        pass
    page.wait_for_timeout(300)


def scrape_with_playwright(
    url: str,
    *,
    max_seconds: float = 10.0,
    max_expand_rounds: int = 0,
    headless: bool = True,
) -> list[dict]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run: pip install playwright && playwright install chromium", file=sys.stderr)
        sys.exit(1)

    started = time.monotonic()
    result_rows: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        try:
            page = browser.new_page()
            page.set_default_navigation_timeout(15000)
            page.set_default_timeout(15000)
            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_timeout(5000)
                try:
                    page.evaluate("""
                        () => {
                            const sdk = document.getElementById('onetrust-consent-sdk');
                            if (sdk) sdk.remove();
                            const filter = document.querySelector('.onetrust-pc-dark-filter');
                            if (filter) filter.remove();
                        }
                    """)
                except Exception:
                    pass
                page.evaluate(SCROLL_JS)
            except Exception:
                print("Page load timed out, scraping whatever loaded")
            try:
                _expand_collapsed_sections(
                    page,
                    started,
                    max_seconds,
                    max_expand_rounds=max(0, int(max_expand_rounds)),
                )
            except Exception:
                pass
            page.wait_for_timeout(1000)
            try:
                page.evaluate(SCROLL_JS)
                page.wait_for_timeout(500)
            except Exception:
                pass

            try:
                raw = page.evaluate(EXTRACT_VISIBLE_CONTACTS_JS) or []
            except Exception:
                raw = []

            result_rows = _dedupe_rows(_rows_from_extract_raw(raw))
        finally:
            browser.close()

    return result_rows


def _migrate_csv_add_phone_column(csv_path: Path) -> None:
    if not csv_path.exists():
        return
    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames_old = reader.fieldnames or []
        if not fieldnames_old:
            return
        if "Phone" in fieldnames_old:
            return
        rows = list(reader)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "Name": r.get("Name", ""),
                "Title": r.get("Title", ""),
                "Company": r.get("Company", ""),
                "Email": r.get("Email", ""),
                "Phone": r.get("Phone", ""),
            })


def append_to_csv(rows: list[dict], company: str, csv_path: Path) -> None:
    _migrate_csv_add_phone_column(csv_path)
    file_exists = csv_path.exists()
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        if not file_exists:
            writer.writeheader()
        for r in rows:
            writer.writerow({
                "Name": r.get("Name", ""),
                "Title": r.get("Title", ""),
                "Company": company,
                "Email": r.get("Email", ""),
                "Phone": r.get("Phone", ""),
            })


def main():
    parser = argparse.ArgumentParser(
        description="Scrape visible contacts (name, title, email, phone) from a page",
    )
    parser.add_argument("url", help="Page URL to scrape")
    parser.add_argument("company", help="Company name to tag each result")
    parser.add_argument("--max-seconds", type=float, default=10.0, help="Hard time budget (default: 10s)")
    parser.add_argument(
        "--max-expand-rounds",
        type=int,
        default=0,
        help="Max rounds to open collapsed accordions / <details> (default: 0; set higher for accordion sites)",
    )
    parser.add_argument("--show-browser", action="store_true", help="Show browser window (default: headless).")
    args = parser.parse_args()

    url = args.url.strip()
    company = args.company.strip()
    if not url or not company:
        print("Usage: python scrape-mailto-college-football.py <url> <company>", file=sys.stderr)
        sys.exit(1)

    rows = scrape_with_playwright(
        url,
        max_seconds=max(1.0, float(args.max_seconds)),
        max_expand_rounds=max(0, int(args.max_expand_rounds)),
        headless=not bool(args.show_browser),
    )
    for r in rows:
        r.setdefault("Name", "")
        r.setdefault("Title", "")
        r.setdefault("Phone", "")

    if rows:
        append_to_csv(rows, company, CSV_PATH)

    print(f"Found {len(rows)} email(s).")
    print(f"CSV: {CSV_PATH}")


if __name__ == "__main__":
    main()
