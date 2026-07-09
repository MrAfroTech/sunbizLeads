#!/usr/bin/env python3
"""
Standalone email scraper: scrapes mailto links and plaintext emails from a URL,
with optional name/title context. Appends results to contactDataApril2026.csv.
Opens collapsed accordions (e.g. MiLB + / checkbox rows) before scraping; decodes
Cloudflare /cdn-cgi/l/email-protection# links. If the first pass finds 0 emails,
also scans onclick/data-* for mailto: and clicks name-like links that may reveal mailto.
Usage: python scrape-mailto.py <url> <company>
"""

import argparse
import csv
import re
import sys
import time
from pathlib import Path
from urllib.parse import unquote

SCRIPT_DIR = Path(__file__).resolve().parent
CSV_PATH = SCRIPT_DIR / "contactDataApril2026.csv"
CSV_HEADERS = ["Name", "Title", "Company", "Email", "Phone"]

# Buttons/links whose text starts with "email", "e-mail", "E-Mail:", etc., then the prospect name.
# Keep the JS below in sync with this pattern.
EMAIL_BUTTON_LABEL_RE = re.compile(r"^e[\s.-]*mail(?:\s+|:\s*)", re.I)

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

# MiLB-style CSS accordions hide staff rows until the checkbox is checked; <details> is similar.
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

# Get title/role from the container of the given element (for "Email [Name]" buttons)
GET_TITLE_FROM_ELEMENT_JS = r"""
(el) => {
  if (!el) return '';
  const container = el.closest('section, article, [class*="accordion"], [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"]');
  if (!container) return '';
  const acc = container.querySelector('.p-accordion__title, [class*="accordion__title"]');
  if (acc) {
    const at = acc.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (at && !at.includes('@')) return at;
  }
  const heading = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="subtitle"], [class*="role"], [class*="position"]');
  if (heading) {
    const t = heading.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (t && !t.includes('@')) return t;
  }
  const all = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
  for (const node of all) {
    const t = node.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (t && t.length > 1 && !t.includes('@') && !/^e[\s.-]*mail\s*$/i.test(t)) return t;
  }
  return '';
}
"""

# Return list of { name, title } for each "Email [Name]" button (so we can right-click each and get email)
GET_EMAIL_BUTTON_INFOS_JS = r"""
() => {
  const getTitle = (el) => {
    if (!el) return '';
    const container = el.closest('section, article, [class*="accordion"], [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"]');
    if (!container) return '';
    const acc = container.querySelector('.p-accordion__title, [class*="accordion__title"]');
    if (acc) {
      const at = acc.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (at && !at.includes('@')) return at;
    }
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="subtitle"], [class*="role"], [class*="position"]');
    if (heading) {
      const t = heading.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (t && !t.includes('@')) return t;
    }
    const all = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
    for (const node of all) {
      const t = node.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (t && t.length > 1 && !t.includes('@') && !/^e[\s.-]*mail\s*$/i.test(t)) return t;
    }
    return '';
  };
  function extractPhoneFromRoot(root) {
    if (!root || !root.querySelector) return '';
    const tel = root.querySelector('a[href^="tel:"], a[href^="TEL:"]');
    if (tel) {
      const raw = (tel.getAttribute('href') || '').replace(/^tel:/i, '').trim();
      const decoded = decodeURIComponent(raw);
      const cleaned = decoded.replace(/[^\d+()\-.\s]/g, '').trim();
      if (cleaned.replace(/\D/g, '').length >= 7) return cleaned.slice(0, 40);
    }
    const dataEl = root.querySelector('[data-phone], [data-telephone], [data-tel]');
    if (dataEl) {
      const v = (dataEl.getAttribute('data-phone') || dataEl.getAttribute('data-telephone') || dataEl.getAttribute('data-tel') || '').trim();
      if (v && /\d/.test(v)) return v.replace(/\s+/g, ' ').slice(0, 40);
    }
    const text = (root.innerText || '').replace(/\s+/g, ' ');
    const re = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,9}/g;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const cand = m[0].trim();
      if (cand.replace(/\D/g, '').length >= 10) return cand.slice(0, 40);
    }
    return '';
  }
  function phoneFromElement(el) {
    if (!el) return '';
    const container = el.closest('section, article, [class*="accordion"], [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"]');
    if (container) {
      const p = extractPhoneFromRoot(container);
      if (p) return p;
    }
    let cur = el;
    for (let i = 0; i < 5 && cur; i++) {
      const p = extractPhoneFromRoot(cur);
      if (p) return p;
      cur = cur.parentElement;
    }
    return '';
  }
  const emailLabel = /^e[\s.-]*mail(?:\s+|:\s*)/i;
  const buttons = [];
  document.querySelectorAll('a, button').forEach(el => {
    const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (emailLabel.test(t)) {
      const name = t.replace(emailLabel, '').trim().slice(0, 80);
      buttons.push({ name, title: getTitle(el).slice(0, 80), phone: phoneFromElement(el).slice(0, 40) });
    }
  });
  return buttons;
}
"""

# JS run in page to collect emails from mailto + context (raw string to avoid escape warnings)
EXTRACT_JS = r"""
() => {
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const results = [];
  const seen = new Set();

  function textOf(el) {
    if (!el) return '';
    return el.innerText.replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  function nameFromLinkText(linkText, email) {
    const t = (linkText || '').replace(/\s+/g, ' ').trim();
    const emailPrefix = /^e[\s.-]*mail(?:\s+|:\s*)/i;
    if (emailPrefix.test(t)) return t.replace(emailPrefix, '').trim().slice(0, 80);
    if (t && !t.includes('@')) return t.slice(0, 80);
    return '';
  }

  function titleFromContainer(el) {
    const container = el.closest('section, article, [class*="accordion"], [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"], [class*="bio"]');
    if (!container) return '';
    const acc = container.querySelector('.p-accordion__title, [class*="accordion__title"]');
    if (acc) {
      const at = textOf(acc).slice(0, 80);
      if (at && !at.match(emailRe)) return at;
    }
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="subtitle"], [class*="role"], [class*="position"]');
    if (heading) {
      const t = textOf(heading).slice(0, 80);
      if (t && !t.match(emailRe)) return t;
    }
    const all = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
    for (const node of all) {
      const t = textOf(node).slice(0, 80);
      if (t && t.length > 1 && !t.includes('@') && !/^e[\s.-]*mail\s*$/i.test(t)) return t;
    }
    return '';
  }

  function extractPhoneFromRoot(root) {
    if (!root || !root.querySelector) return '';
    const tel = root.querySelector('a[href^="tel:"], a[href^="TEL:"]');
    if (tel) {
      const raw = (tel.getAttribute('href') || '').replace(/^tel:/i, '').trim();
      const decoded = decodeURIComponent(raw);
      const cleaned = decoded.replace(/[^\d+()\-.\s]/g, '').trim();
      if (cleaned.replace(/\D/g, '').length >= 7) return cleaned.slice(0, 40);
    }
    const dataEl = root.querySelector('[data-phone], [data-telephone], [data-tel]');
    if (dataEl) {
      const v = (dataEl.getAttribute('data-phone') || dataEl.getAttribute('data-telephone') || dataEl.getAttribute('data-tel') || '').trim();
      if (v && /\d/.test(v)) return v.replace(/\s+/g, ' ').slice(0, 40);
    }
    const text = (root.innerText || '').replace(/\s+/g, ' ');
    const phoneRe = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,9}/g;
    let pm;
    phoneRe.lastIndex = 0;
    while ((pm = phoneRe.exec(text)) !== null) {
      const cand = pm[0].trim();
      if (cand.replace(/\D/g, '').length >= 10) return cand.slice(0, 40);
    }
    return '';
  }

  function phoneFromElement(el) {
    if (!el) return '';
    const container = el.closest('section, article, [class*="accordion"], [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"], [class*="bio"]');
    if (container) {
      const p = extractPhoneFromRoot(container);
      if (p) return p;
    }
    let cur = el;
    for (let i = 0; i < 5 && cur; i++) {
      const p = extractPhoneFromRoot(cur);
      if (p) return p;
      cur = cur.parentElement;
    }
    return '';
  }

  function decodeCloudflareEmail(hex) {
    if (!hex || hex.length < 4) return '';
    const k = parseInt(hex.slice(0, 2), 16);
    if (Number.isNaN(k)) return '';
    let out = '';
    for (let i = 2; i + 1 < hex.length; i += 2) {
      const v = parseInt(hex.slice(i, i + 2), 16);
      if (Number.isNaN(v)) return '';
      out += String.fromCharCode(v ^ k);
    }
    return out.trim();
  }

  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    const href = (a.getAttribute('href') || '').trim();
    const match = href.match(/mailto:([^?\s]+)/);
    if (!match) return;
    const email = match[1].trim();
    if (!email || !email.includes('@') || seen.has(email.toLowerCase())) return;
    seen.add(email.toLowerCase());
    const name = nameFromLinkText(a.innerText, email) || nameFromLinkText(a.textContent, email);
    const title = titleFromContainer(a);
    const phone = phoneFromElement(a);
    results.push({ email, name: name.slice(0, 80), title: title.slice(0, 80), phone: phone.slice(0, 40) });
  });

  document.querySelectorAll('a[href*="email-protection"]').forEach(a => {
    const href = (a.getAttribute('href') || '').trim();
    const m = href.match(/email-protection#([a-f0-9]+)/i);
    if (!m) return;
    const email = decodeCloudflareEmail(m[1]);
    if (!email || !email.includes('@') || seen.has(email.toLowerCase())) return;
    seen.add(email.toLowerCase());
    const name = nameFromLinkText(a.innerText, email) || nameFromLinkText(a.textContent, email);
    const title = titleFromContainer(a);
    const phone = phoneFromElement(a);
    results.push({ email, name: name.slice(0, 80), title: title.slice(0, 80), phone: phone.slice(0, 40) });
  });

  document.querySelectorAll('[data-email], [data-mail]').forEach(el => {
    const email = (el.getAttribute('data-email') || el.getAttribute('data-mail') || '').trim();
    if (email && email.includes('@') && !seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase());
      const title = titleFromContainer(el);
      const phone = phoneFromElement(el);
      results.push({ email, name: '', title: title.slice(0, 80), phone: phone.slice(0, 40) });
    }
  });

  const fullText = textOf(document.body);
  let m;
  emailRe.lastIndex = 0;
  while ((m = emailRe.exec(fullText)) !== null) {
    const email = m[0];
    if (seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    results.push({ email, name: '', title: '', phone: '' });
  }

  return results;
}
"""

# When the page hides mailto until interaction: pull mailto from onclick / data-* strings.
SCAN_INLINE_MAILTO_JS = r"""
() => {
  const emailRe = /mailto:([^'"\s?)>]+)/gi;
  const results = [];
  const seen = new Set();

  function textOf(el) {
    if (!el) return '';
    return el.innerText.replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  function titleFromContainer(el) {
    const container = el.closest('section, article, [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"]');
    if (!container) return '';
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="subtitle"], [class*="role"], [class*="position"]');
    if (heading) {
      const t = textOf(heading).slice(0, 80);
      if (t && !t.includes('@')) return t;
    }
    const all = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
    for (const node of all) {
      const t = textOf(node).slice(0, 80);
      if (t && t.length > 1 && !t.includes('@') && !/^e[\s.-]*mail\s*$/i.test(t)) return t;
    }
    return '';
  }

  function harvestFromString(s, el) {
    if (!s) return;
    let m;
    emailRe.lastIndex = 0;
    while ((m = emailRe.exec(s)) !== null) {
      let email = (m[1] || '').trim();
      try { email = decodeURIComponent(email); } catch (e) {}
      if (!email || !email.includes('@')) continue;
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rawName = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const name = rawName && !rawName.includes('@') ? rawName : '';
      const title = titleFromContainer(el).slice(0, 80);
      results.push({ email, name, title, phone: '' });
    }
  }

  document.querySelectorAll('a, button').forEach(el => {
    ['onclick', 'data-onclick', 'data-url', 'data-href', 'data-link', 'data-mailto'].forEach(attr => {
      harvestFromString(el.getAttribute(attr) || '', el);
    });
  });

  return results;
}
"""

# Collect anchors whose visible text looks like a person name but href is not already mailto:
# clicking may navigate to mailto: or reveal mailto in the DOM.
COLLECT_NAME_MAILTO_CANDIDATES_JS = r"""
() => {
  window.__smtpNameMailtoCandidates = [];
  function looksLikePersonName(t) {
    t = (t || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length < 3 || t.length > 80) return false;
    if (t.includes('@')) return false;
    if (/^e[\s.-]*mail\b/i.test(t)) return false;
    if (/\d{3}[-.\s]?\d{3}/.test(t)) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    const wordish = /^[A-Za-z][A-Za-z'.-]*$/;
    const okWords = words.filter(w => wordish.test(w));
    if (okWords.length < 2) return false;
    return true;
  }
  document.querySelectorAll('a[href]').forEach(a => {
    const href = (a.getAttribute('href') || '').trim();
    if (/^mailto:/i.test(href)) return;
    const t = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!looksLikePersonName(t)) return;
    const hl = href.toLowerCase();
    if (hl.startsWith('http://') || hl.startsWith('https://') || hl.startsWith('//')) return;
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return;
    const looksInteractive =
      hl.startsWith('#') || hl.startsWith('javascript:') || href.trim() === '';
    if (!looksInteractive) return;
    window.__smtpNameMailtoCandidates.push(a);
  });
  return window.__smtpNameMailtoCandidates.length;
}
"""

GET_NAME_CANDIDATE_META_JS = r"""
(i) => {
  const list = window.__smtpNameMailtoCandidates || [];
  const a = list[i];
  if (!a) return { name: '', title: '' };
  const name = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const container = a.closest('section, article, [class*="card"], [class*="staff"], [class*="team"], [class*="contact"], [class*="bio"], [class*="member"], li, tr, [class*="profile"]');
  let title = '';
  if (container) {
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="subtitle"], [class*="role"], [class*="position"]');
    if (heading) {
      const ht = heading.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (ht && !ht.includes('@')) title = ht;
    }
    if (!title) {
      const all = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
      for (const node of all) {
        const nt = node.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
        if (nt && nt.length > 1 && !nt.includes('@') && !/^e[\s.-]*mail\s*$/i.test(nt)) { title = nt; break; }
      }
    }
  }
  return { name, title };
}
"""

CLICK_NAME_CANDIDATE_JS = r"""
(i) => {
  const list = window.__smtpNameMailtoCandidates || [];
  const a = list[i];
  if (a) a.click();
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


def _try_zero_email_fallback(
    page,
    original_url: str,
    started: float,
    max_seconds: float,
    max_name_clicks: int,
) -> list[dict]:
    """If the normal scrape found nothing: inline mailto strings, then click name-like links."""
    out: list[dict] = []
    if (time.monotonic() - started) >= max_seconds:
        return out

    inline = page.evaluate(SCAN_INLINE_MAILTO_JS) or []
    out.extend(_rows_from_extract_raw(inline))
    out = _dedupe_rows(out)
    if out:
        return out

    n = int(page.evaluate(COLLECT_NAME_MAILTO_CANDIDATES_JS) or 0)
    if n <= 0:
        return out

    for i in range(min(n, max(0, int(max_name_clicks)))):
        if (time.monotonic() - started) >= max_seconds:
            break
        meta = page.evaluate(GET_NAME_CANDIDATE_META_JS, i) or {}
        name_hint = (meta.get("name") or "").strip()[:80]
        title_hint = (meta.get("title") or "").strip()[:80]

        try:
            prev_raw = page.evaluate(EXTRACT_JS) or []
        except Exception:
            prev_raw = []
        prev_emails = {((r.get("email") or "").strip().lower()) for r in prev_raw if r.get("email")}

        before_url = page.url
        email_from_nav = ""

        try:
            with page.expect_navigation(timeout=2500):
                page.evaluate(CLICK_NAME_CANDIDATE_JS, i)
        except Exception:
            try:
                page.evaluate(CLICK_NAME_CANDIDATE_JS, i)
            except Exception:
                pass

        page.wait_for_timeout(600)

        nav = page.url
        if nav and "mailto:" in nav.lower():
            email_from_nav = (
                nav.split("mailto:", 1)[-1].split("?", 1)[0].split("#", 1)[0].strip()
            )
            try:
                email_from_nav = unquote(email_from_nav)
            except Exception:
                pass

        if email_from_nav and "@" in email_from_nav:
            out.append({
                "Name": name_hint,
                "Title": title_hint,
                "Email": email_from_nav,
                "Phone": "",
            })
        else:
            try:
                post_raw = page.evaluate(EXTRACT_JS) or []
            except Exception:
                post_raw = []
            for r in post_raw:
                em = (r.get("email") or "").strip()
                if not em or em.lower() in prev_emails:
                    continue
                row = {
                    "Name": (r.get("name") or "").strip() or name_hint,
                    "Title": (r.get("title") or "").strip() or title_hint,
                    "Email": em,
                    "Phone": (r.get("phone") or "").strip()[:40],
                }
                out.append(row)

        out = _dedupe_rows(out)

        if page.url != before_url:
            try:
                page.goto(original_url, wait_until="domcontentloaded")
                page.wait_for_timeout(400)
            except Exception:
                try:
                    page.goto(before_url, wait_until="domcontentloaded")
                except Exception:
                    pass
            try:
                page.evaluate(COLLECT_NAME_MAILTO_CANDIDATES_JS)
            except Exception:
                pass

        page.wait_for_timeout(300)

    return out


def _expand_collapsed_sections(
    page,
    started: float,
    wall_seconds: float,
    max_rounds: int,
) -> None:
    """Open checkbox accordions (e.g. MiLB p-accordion) and <details> panels so emails exist in the DOM."""
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


def _click_copy_email_address_menu(page) -> None:
    """Chromium's context menu may say 'Copy Email Address' or 'Copy e-mail address'."""
    locators = (
        page.locator("text=Copy Email Address").first,
        page.get_by_text(re.compile(r"Copy\s+e[\s.-]*mail\s+address", re.I)).first,
    )
    for loc in locators:
        try:
            loc.wait_for(state="visible", timeout=2000)
            loc.click()
            return
        except Exception:
            continue
    raise TimeoutError("Copy email address menu item not found")


def scrape_with_playwright(
    url: str,
    *,
    max_seconds: float = 10.0,
    max_buttons: int = 40,
    max_name_clicks: int = 35,
    max_expand_rounds: int = 12,
    headless: bool = True,
) -> list[dict]:
    """Use Playwright: expand hidden accordions, then mailto / Cloudflare e-mail links / e-mail buttons."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run: pip install playwright && playwright install chromium", file=sys.stderr)
        sys.exit(1)

    email_text_pattern = EMAIL_BUTTON_LABEL_RE
    started = time.monotonic()
    result_rows: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        try:
            page = browser.new_page()
            # Keep timeouts low; we also enforce a hard wall-clock budget.
            page.set_default_navigation_timeout(15000)
            page.set_default_timeout(15000)
            page.context.grant_permissions(["clipboard-read"])
            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_timeout(5000)
                # Dismiss OneTrust cookie banner if present — it blocks all clicks
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
            original_url = page.url

            infos = page.evaluate(GET_EMAIL_BUTTON_INFOS_JS) or []
            email_button_handles = page.query_selector_all("a, button")
            email_button_handles = [
                el
                for el in email_button_handles
                if email_text_pattern.match((el.inner_text() or "").replace("\n", " ").strip())
            ]
            n_buttons = len(email_button_handles)
            raw: list = []

            try:
                has_cloudflare_obfuscated = bool(
                    page.evaluate(
                        "() => !!document.querySelector('a[href*=\"cdn-cgi/l/email-protection\"]')"
                    )
                )
            except Exception:
                has_cloudflare_obfuscated = False

            # Per-button right-click is slow; Cloudflare-encoded hrefs are decoded in EXTRACT_JS instead.
            email_button_attempts = min(n_buttons, max_buttons)
            rows_from_buttons: list[dict] = []
            for i in range(email_button_attempts):
                if (time.monotonic() - started) >= max_seconds:
                    break
                name = (infos[i].get("name") or "").strip() if i < len(infos) else ""
                title = (infos[i].get("title") or "").strip() if i < len(infos) else ""
                phone = (infos[i].get("phone") or "").strip()[:40] if i < len(infos) else ""
                el = email_button_handles[i]
                email = ""

                # First: read mailto: directly from href (covers MiLB pattern)
                try:
                    href = (el.get_attribute("href") or "").strip()
                    if href.lower().startswith("mailto:"):
                        href_email_part = href[len("mailto:"):].split("?")[0].split("#")[0].strip()
                        email = unquote(href_email_part).strip()
                except Exception:
                    pass

                # Second fallback: right-click copy email address
                if not email:
                    try:
                        el.click(button="right")
                        _click_copy_email_address_menu(page)
                        email = (page.evaluate("() => navigator.clipboard.readText()") or "").strip()
                    except Exception:
                        try:
                            page.keyboard.press("Escape")
                        except Exception:
                            pass

                # Third fallback: intercept mailto: request fired on click
                if not email:
                    try:
                        intercepted = []

                        def handle_mailto(request):
                            if request.url.lower().startswith("mailto:"):
                                intercepted.append(request.url)

                        page.on("request", handle_mailto)
                        try:
                            el.click()
                            page.wait_for_timeout(800)
                        finally:
                            try:
                                page.remove_listener("request", handle_mailto)
                            except Exception:
                                pass

                        if intercepted:
                            intercepted_part = intercepted[0][len("mailto:"):].split("?")[0].split("#")[0].strip()
                            try:
                                email = unquote(intercepted_part).strip()
                            except Exception:
                                email = intercepted_part.strip()
                    except Exception:
                        pass

                if email and "@" in email:
                    rows_from_buttons.append({
                        "Name": name[:80],
                        "Title": title[:80],
                        "Email": email,
                        "Phone": phone,
                    })

                page.wait_for_timeout(200)

            try:
                raw = page.evaluate(EXTRACT_JS) or []
            except Exception:
                raw = []

            rows = _dedupe_rows(rows_from_buttons + _rows_from_extract_raw(raw))
            if not rows:
                try:
                    rows = _dedupe_rows(
                        rows
                        + _try_zero_email_fallback(
                            page,
                            original_url,
                            started,
                            max_seconds,
                            max_name_clicks,
                        )
                    )
                except Exception:
                    pass
            result_rows = rows
        finally:
            browser.close()

    return result_rows


def _migrate_csv_add_phone_column(csv_path: Path) -> None:
    """If the output CSV exists with the old header (no Phone), rewrite with Phone column."""
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
    """Append rows to CSV; create file with headers if needed."""
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
    parser = argparse.ArgumentParser(description="Scrape mailto and emails from a URL")
    parser.add_argument("url", help="Page URL to scrape")
    parser.add_argument("company", help="Company name to tag each result")
    parser.add_argument("--max-seconds", type=float, default=10.0, help="Hard time budget for scraping (default: 10s)")
    parser.add_argument(
        "--max-buttons",
        type=int,
        default=40,
        help="Max 'Email ...' / 'e-mail ...' style buttons to attempt (default: 40)",
    )
    parser.add_argument(
        "--max-name-clicks",
        type=int,
        default=35,
        help="When 0 emails: max name-like links to click looking for mailto (default: 35)",
    )
    parser.add_argument(
        "--max-expand-rounds",
        type=int,
        default=12,
        help="Max rounds to open collapsed accordions / <details> (default: 12)",
    )
    parser.add_argument("--show-browser", action="store_true", help="Show browser window (slower). Default is headless.")
    args = parser.parse_args()

    url = args.url.strip()
    company = args.company.strip()
    if not url or not company:
        print("Usage: python scrape-mailto.py <url> <company>", file=sys.stderr)
        sys.exit(1)

    rows = scrape_with_playwright(
        url,
        max_seconds=max(1.0, float(args.max_seconds)),
        max_buttons=max(0, int(args.max_buttons)),
        max_name_clicks=max(0, int(args.max_name_clicks)),
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