#!/usr/bin/env python3
"""
Batch email scraper: reads teams from CSV, opens each homepage, then walks every
visible primary-nav link (optionally after opening the mobile nav). After each click it
checks whether the destination matches STAFF_KEYWORDS or runs the usual staff-link click
pass. Falls back to a site-wide keyword scan. Then runs the mailto / plaintext email
scrape. Appends staff_emails.csv and flagged_sites.csv row-by-row.

Team list is always ``fbsFcsTeams.csv`` next to this script (FBS/FCS NCAA teams only).
Also accepts business_group, region, company_name as aliases for tier/league/team_name.

Run: python scrape-mailto-advanced.py [--limit N] [--show-browser]
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
import sys
import time
from pathlib import Path
from urllib.parse import unquote

SCRIPT_DIR = Path(__file__).resolve().parent
MASTER_TEAMS_CSV = SCRIPT_DIR / "football_teams.csv"
# Sole input for this scraper (FBS/FCS list).
INPUT_TEAMS_CSV = SCRIPT_DIR / "fbsFcsTeams.csv"
STAFF_EMAILS_CSV = SCRIPT_DIR / "staff_emails.csv"
FLAGGED_CSV = SCRIPT_DIR / "flagged_sites.csv"

STAFF_EMAILS_HEADERS = ["tier", "league", "team_name", "email", "source_url"]
FLAGGED_HEADERS = ["tier", "league", "team_name", "website", "reason"]

# No STAFF_KEYWORDS match on any button / role=button / link on the homepage.
FLAG_NO_KEYWORD_NAV = "no_staff_keyword_nav"

STAFF_KEYWORDS = (
    "staff",
    "front office",
    "directory",
    "personnel",
    "management",
    "executives",
)

# Homepage: hamburger / nav toggles / drawer triggers we try before a global keyword scan.
MENU_OPENER_SELECTOR = (
    "nav button, [role='navigation'] button, [role='banner'] button, "
    "header button, button[aria-expanded], button[aria-controls], "
    "button[aria-haspopup='true'], button.navbar-toggler, "
    "button[class*='menu-toggle'], button[class*='hamburger'], "
    "[class*='navbar-toggler'], details summary"
)

# After opening a menu, search these containers first (then whole viewport).
POST_MENU_SCOPE_SELECTORS = (
    "[role='navigation']",
    "nav",
    "[role='banner']",
    "header",
    "[aria-modal='true']",
    "[class*='dropdown-menu']",
    "[class*='drawer']",
    "[class*='off-canvas']",
    "[class*='mobile-nav']",
    "[class*='site-menu']",
)

# Flagged reason when the URL is dead, HTTP error, or a generic 404 / parked / for-sale splash.
BAD_WEBSITE_REASON = "bad_website_error"

# Main navigation returned an error, or visible page looks like a global 404 / parked domain page.
_BAD_LANDING_PAGE_RE = re.compile(
    r"("
    r"\b404\b|\b410\b|"
    r"page not found|site not found|webpage not found|page could not be found|this page (could not be found|cannot be found|isn\'t available)|"
    r"the page you (requested )?(was )?not found|requested (url|page) (was )?not found|file not found|"
    r"error 404|http (error )?404|status\s*404|nginx 404|apache.*404|"
    r"domain (is )?for sale|buy this domain|parked domain|domain parked|this domain (may be for sale|is parked)|"
    r"website (is )?(currently )?unavailable|account (has been )?suspended|"
    r"this site can\'t be reached|can\'t reach this page"
    r")",
    re.I,
)


async def _is_bad_website_landing(page, response: object | None) -> bool:
    """True if HTTP error on main document or page content looks like a dead / 404 / parked host."""
    if response is not None:
        try:
            st = response.status
            if st >= 400:
                return True
        except Exception:
            pass
    try:
        text = await page.evaluate(
            r"""() => {
  const title = (document.title || '');
  const h1 = document.querySelector('h1');
  const h1t = h1 ? h1.innerText : '';
  const body = (document.body && document.body.innerText)
    ? document.body.innerText.slice(0, 6000) : '';
  return (title + '\n' + h1t + '\n' + body).toLowerCase();
}"""
        )
    except Exception:
        return False
    if not (text or "").strip():
        return False
    if _BAD_LANDING_PAGE_RE.search(text):
        return True
    first = text.split("\n", 1)[0].strip()
    if re.fullmatch(r"404[\s\-–—|]*.*", first) or re.match(r"^404\s", first):
        return True
    return False

# Buttons/links whose text starts with "email", "e-mail", "E-Mail:", etc., then the prospect name.
EMAIL_BUTTON_LABEL_RE = re.compile(r"^e[\s.-]*mail(?:\s+|:\s*)", re.I)

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


def _staff_link_matches(text: str, href: str) -> bool:
    blob = f"{text} {href}".lower()
    return any(kw in blob for kw in STAFF_KEYWORDS)


def _blob_matches_staff_keywords(blob: str) -> bool:
    b = (blob or "").lower().replace("-", " ").replace("_", " ")
    return any(kw in b for kw in STAFF_KEYWORDS)


async def _page_looks_like_staff_destination(page) -> bool:
    """True if URL path, title, or main heading suggests we're already on staff-style content."""
    try:
        url = (page.url or "").lower().replace("-", " ").replace("_", " ")
        extra = await page.evaluate(
            r"""() => {
  const h1 = document.querySelector('h1');
  return ((document.title || '') + ' ' + (h1 ? h1.innerText : '')).slice(0, 1200);
}"""
        )
        blob = url + " " + (extra or "").lower().replace("-", " ").replace("_", " ")
        return _blob_matches_staff_keywords(blob)
    except Exception:
        return False


def _urls_same_page(a: str, b: str) -> bool:
    """Same document for 'still on homepage' checks (ignore #fragment, trailing /)."""

    def norm(u: str) -> str:
        u = (u or "").split("#", 1)[0].rstrip("/")
        return u.lower()

    return norm(a) == norm(b)


def _normalize_team_row(row: dict) -> tuple[str, str, str, str]:
    tier = (row.get("tier") or row.get("business_group") or "").strip()
    league = (row.get("league") or row.get("region") or "").strip()
    team_name = (row.get("team_name") or row.get("company_name") or "").strip()
    website = (row.get("website") or "").strip()
    return tier, league, team_name, website


def append_staff_email_row(
    tier: str,
    league: str,
    team_name: str,
    email: str,
    source_url: str,
) -> None:
    path = STAFF_EMAILS_CSV
    exists = path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=STAFF_EMAILS_HEADERS)
        if not exists:
            w.writeheader()
        w.writerow({
            "tier": tier,
            "league": league,
            "team_name": team_name,
            "email": email,
            "source_url": source_url,
        })


def append_flagged_row(
    tier: str,
    league: str,
    team_name: str,
    website: str,
    reason: str,
) -> None:
    path = FLAGGED_CSV
    exists = path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FLAGGED_HEADERS)
        if not exists:
            w.writeheader()
        w.writerow({
            "tier": tier,
            "league": league,
            "team_name": team_name,
            "website": website,
            "reason": reason,
        })


async def _click_copy_email_address_menu(page) -> None:
    locators = (
        page.locator("text=Copy Email Address").first,
        page.get_by_text(re.compile(r"Copy\s+e[\s.-]*mail\s+address", re.I)).first,
    )
    for loc in locators:
        try:
            await loc.wait_for(state="visible", timeout=2000)
            await loc.click()
            return
        except Exception:
            continue
    raise TimeoutError("Copy email address menu item not found")


async def _expand_collapsed_sections(
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
            opened = int(await page.evaluate(EXPAND_COLLAPSED_JS) or 0)
        except Exception:
            break
        if opened <= 0:
            break
        await page.wait_for_timeout(400)
    try:
        await page.evaluate(SCROLL_JS)
    except Exception:
        pass
    await page.wait_for_timeout(300)


async def _try_zero_email_fallback(
    page,
    original_url: str,
    started: float,
    max_seconds: float,
    max_name_clicks: int,
) -> list[dict]:
    out: list[dict] = []
    if (time.monotonic() - started) >= max_seconds:
        return out

    inline = await page.evaluate(SCAN_INLINE_MAILTO_JS) or []
    out.extend(_rows_from_extract_raw(inline))
    out = _dedupe_rows(out)
    if out:
        return out

    n = int(await page.evaluate(COLLECT_NAME_MAILTO_CANDIDATES_JS) or 0)
    if n <= 0:
        return out

    for i in range(min(n, max(0, int(max_name_clicks)))):
        if (time.monotonic() - started) >= max_seconds:
            break
        meta = await page.evaluate(GET_NAME_CANDIDATE_META_JS, i) or {}
        name_hint = (meta.get("name") or "").strip()[:80]
        title_hint = (meta.get("title") or "").strip()[:80]

        try:
            prev_raw = await page.evaluate(EXTRACT_JS) or []
        except Exception:
            prev_raw = []
        prev_emails = {((r.get("email") or "").strip().lower()) for r in prev_raw if r.get("email")}

        before_url = page.url
        email_from_nav = ""

        try:
            async with page.expect_navigation(timeout=2500):
                await page.evaluate(CLICK_NAME_CANDIDATE_JS, i)
        except Exception:
            try:
                await page.evaluate(CLICK_NAME_CANDIDATE_JS, i)
            except Exception:
                pass

        await page.wait_for_timeout(600)

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
                post_raw = await page.evaluate(EXTRACT_JS) or []
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
                await page.goto(original_url, wait_until="domcontentloaded")
                await page.wait_for_timeout(400)
            except Exception:
                try:
                    await page.goto(before_url, wait_until="domcontentloaded")
                except Exception:
                    pass
            try:
                await page.evaluate(COLLECT_NAME_MAILTO_CANDIDATES_JS)
            except Exception:
                pass

        await page.wait_for_timeout(300)

    return out


async def scrape_emails_from_loaded_page(
    page,
    *,
    max_seconds: float = 10.0,
    max_buttons: int = 40,
    max_name_clicks: int = 35,
    max_expand_rounds: int = 12,
) -> tuple[list[dict], str]:
    """Run existing extraction on the current page; returns rows and final page URL (source)."""
    email_text_pattern = EMAIL_BUTTON_LABEL_RE
    started = time.monotonic()
    result_rows: list[dict] = []

    page.set_default_navigation_timeout(15000)
    page.set_default_timeout(15000)

    try:
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(5000)
        try:
            await page.evaluate("""
                () => {
                    const sdk = document.getElementById('onetrust-consent-sdk');
                    if (sdk) sdk.remove();
                    const filter = document.querySelector('.onetrust-pc-dark-filter');
                    if (filter) filter.remove();
                }
            """)
        except Exception:
            pass
        await page.evaluate(SCROLL_JS)
    except Exception:
        print("Page settle timed out, scraping whatever loaded", file=sys.stderr)

    try:
        await _expand_collapsed_sections(
            page,
            started,
            max_seconds,
            max_expand_rounds=max(0, int(max_expand_rounds)),
        )
    except Exception:
        pass
    await page.wait_for_timeout(1000)
    try:
        await page.evaluate(SCROLL_JS)
        await page.wait_for_timeout(500)
    except Exception:
        pass
    original_url = page.url

    infos = await page.evaluate(GET_EMAIL_BUTTON_INFOS_JS) or []
    email_button_handles = await page.query_selector_all("a, button")
    email_button_handles = [
        el
        for el in email_button_handles
        if email_text_pattern.match((await el.inner_text() or "").replace("\n", " ").strip())
    ]
    n_buttons = len(email_button_handles)
    raw: list = []

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

        try:
            href = (await el.get_attribute("href") or "").strip()
            if href.lower().startswith("mailto:"):
                href_email_part = href[len("mailto:"):].split("?")[0].split("#")[0].strip()
                email = unquote(href_email_part).strip()
        except Exception:
            pass

        if not email:
            try:
                await el.click(button="right")
                await _click_copy_email_address_menu(page)
                email = (await page.evaluate("() => navigator.clipboard.readText()") or "").strip()
            except Exception:
                try:
                    await page.keyboard.press("Escape")
                except Exception:
                    pass

        if not email:
            try:
                intercepted: list[str] = []

                def handle_mailto(request):
                    if request.url.lower().startswith("mailto:"):
                        intercepted.append(request.url)

                page.on("request", handle_mailto)
                try:
                    await el.click()
                    await page.wait_for_timeout(800)
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

        await page.wait_for_timeout(200)

    try:
        raw = await page.evaluate(EXTRACT_JS) or []
    except Exception:
        raw = []

    rows = _dedupe_rows(rows_from_buttons + _rows_from_extract_raw(raw))
    if not rows:
        try:
            rows = _dedupe_rows(
                rows
                + await _try_zero_email_fallback(
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

    return result_rows, page.url


async def _try_click_staff_navigation_element(page, el) -> bool:
    """Click a button/link that already matched STAFF_KEYWORDS; wait for navigation or hash. Returns True if click ran."""
    href = ""
    try:
        if await el.evaluate("e => e.tagName.toLowerCase()") == "a":
            href = (await el.get_attribute("href")) or ""
    except Exception:
        pass
    prev = page.url
    try:
        async with page.expect_navigation(timeout=15000):
            await el.click()
    except Exception:
        try:
            await el.click()
        except Exception:
            return False
    try:
        await page.wait_for_load_state("domcontentloaded")
    except Exception:
        pass
    await page.wait_for_timeout(800)
    if page.url == prev and not href.strip().lower().startswith("#"):
        await page.wait_for_timeout(500)
    return True


async def _clickable_label_and_href(el) -> tuple[str, str]:
    """Visible text for buttons/links plus href when the element is an anchor."""
    try:
        tag = await el.evaluate("e => e.tagName.toLowerCase()")
    except Exception:
        tag = ""
    text = ""
    try:
        if tag == "input":
            text = (await el.get_attribute("value")) or ""
        else:
            text = (await el.inner_text()) or ""
    except Exception:
        text = ""
    text = text.replace("\n", " ").strip()
    href = ""
    if tag == "a":
        try:
            href = (await el.get_attribute("href")) or ""
        except Exception:
            href = ""
    return text, href


async def find_and_click_staff_nav(page, container: object | None = None) -> bool:
    """Find a button/link matching STAFF_KEYWORDS and click it.

    If ``container`` is an ElementHandle, search only inside that subtree; otherwise
    search the whole page. Prefer real buttons / role=button, then ordinary links.
    """
    phase1_selectors = (
        "button",
        'input[type="button"]',
        'input[type="submit"]',
        '[role="button"]',
    )
    phase2_selector = 'a[href]:not([role="button"])'

    async def query_all(sel: str):
        if container is not None:
            return await container.query_selector_all(sel)
        return await page.query_selector_all(sel)

    for selector in phase1_selectors:
        try:
            els = await query_all(selector)
        except Exception:
            continue
        for el in els:
            try:
                if not await el.is_visible():
                    continue
            except Exception:
                continue
            text, href = await _clickable_label_and_href(el)
            if not _staff_link_matches(text, href):
                continue
            return await _try_click_staff_navigation_element(page, el)

    try:
        anchors = await query_all(phase2_selector)
    except Exception:
        anchors = []
    for a in anchors:
        try:
            if not await a.is_visible():
                continue
        except Exception:
            continue
        text, href = await _clickable_label_and_href(a)
        if not _staff_link_matches(text, href):
            continue
        return await _try_click_staff_navigation_element(page, a)

    return False


async def _collect_unique_menu_openers(page) -> list:
    """Visible menu-style controls, deduped; fresh handles (call after any navigation)."""
    try:
        openers = await page.query_selector_all(MENU_OPENER_SELECTOR)
    except Exception:
        return []

    seen: set[str] = set()
    unique_openers: list = []
    for el in openers:
        try:
            if not await el.is_visible():
                continue
        except Exception:
            continue
        try:
            key = await el.evaluate("e => e.outerHTML.slice(0, 400)")
        except Exception:
            key = ""
        if key in seen:
            continue
        seen.add(key)
        unique_openers.append(el)
    return unique_openers[:45]


NAV_ANCHOR_SELECTORS = (
    "nav a[href]",
    "[role='navigation'] a[href]",
    "header nav a[href]",
    "[class*='main-nav'] a[href]",
    "[class*='primary-nav'] a[href]",
    "[class*='site-header'] nav a[href]",
    "#site-navigation a[href]",
    "#main-navigation a[href]",
)


async def _collect_nav_anchor_handles(page) -> list:
    """Visible in-page anchors that look like primary navigation, deduped by link target + label."""
    seen: set[tuple[str, str]] = set()
    out: list = []
    for sel in NAV_ANCHOR_SELECTORS:
        try:
            els = await page.query_selector_all(sel)
        except Exception:
            continue
        for el in els:
            try:
                if not await el.is_visible():
                    continue
            except Exception:
                continue
            try:
                in_footer = await el.evaluate("e => !!(e.closest && e.closest('footer'))")
            except Exception:
                in_footer = False
            if in_footer:
                continue
            href = (await el.get_attribute("href")) or ""
            href = href.strip()
            if not href:
                continue
            low = href.lower()
            if low.startswith(("mailto:", "tel:", "javascript:")):
                continue
            if low == "#":
                continue
            path_part = href.split("#", 1)[0].strip()
            if not path_part and href.startswith("#"):
                continue
            try:
                text = ((await el.inner_text()) or "").replace("\n", " ").strip()[:120]
            except Exception:
                text = ""
            key = (path_part.lower(), text.lower()[:80])
            if key in seen:
                continue
            seen.add(key)
            out.append(el)
            if len(out) >= 48:
                return out
    return out


async def _collect_nav_top_level_lis(page) -> list:
    """Ordered <li> items under primary nav (one top-level menu option per row)."""
    selectors = (
        "nav > ul > li",
        "[role='navigation'] > ul > li",
        "header nav > ul > li",
        "#main-navigation > ul > li",
        "#site-navigation > ul > li",
        "[class*='main-nav'] > ul > li",
    )
    seen: set[str] = set()
    out: list = []
    for sel in selectors:
        try:
            els = await page.query_selector_all(sel)
        except Exception:
            continue
        for el in els:
            try:
                if not await el.is_visible():
                    continue
            except Exception:
                continue
            try:
                in_footer = await el.evaluate("e => !!(e.closest && e.closest('footer'))")
            except Exception:
                in_footer = False
            if in_footer:
                continue
            try:
                key = await el.evaluate("e => e.outerHTML.slice(0, 280)")
            except Exception:
                key = ""
            if key in seen:
                continue
            seen.add(key)
            out.append(el)
            if len(out) >= 42:
                return out
    return out


async def _try_staff_keyword_within_nav_option(page, anchor_el) -> bool:
    """Search STAFF_KEYWORDS only inside this nav item (e.g. one <li> subtree), after hover."""
    ch = await anchor_el.evaluate_handle("a => { const li = a.closest('li'); return li || a; }")
    try:
        container = ch.as_element()
        if container is None:
            container = anchor_el
        try:
            await anchor_el.scroll_into_view_if_needed()
        except Exception:
            pass
        try:
            await container.hover(timeout=5000)
        except Exception:
            try:
                await anchor_el.hover(timeout=4000)
            except Exception:
                pass
        await page.wait_for_timeout(320)
        return await find_and_click_staff_nav(page, container=container)
    except Exception:
        return False
    finally:
        try:
            await ch.dispose()
        except Exception:
            pass


async def _click_nav_link_expect_load(page, el) -> bool:
    """Click a nav anchor; wait for navigation or DOM update."""
    try:
        async with page.expect_navigation(timeout=15000):
            await el.click(timeout=8000)
    except Exception:
        try:
            await el.click(timeout=8000)
        except Exception:
            return False
    try:
        await page.wait_for_load_state("domcontentloaded")
    except Exception:
        pass
    await page.wait_for_timeout(500)
    return True


async def _search_current_page_for_staff_keywords(page) -> bool:
    """On the page we landed on from a nav click: detect staff-style content or find and
    click a control whose visible text / href matches STAFF_KEYWORDS."""
    if await _page_looks_like_staff_destination(page):
        return True
    try:
        if await find_and_click_staff_nav(page, container=None):
            return True
    except Exception:
        pass
    for scope_sel in POST_MENU_SCOPE_SELECTORS:
        try:
            nodes = await page.query_selector_all(scope_sel)
        except Exception:
            continue
        for node in nodes[:12]:
            try:
                if await find_and_click_staff_nav(page, container=node):
                    return True
            except Exception:
                continue
    return False


async def find_staff_nav_with_menu_exploration(page, base_url: str) -> bool:
    """Homepage: for each top-level nav option (each ``<li>``, then each nav link in order)
    search only that option's subtree for STAFF_KEYWORDS (hover to open dropdowns). If no
    match on the home view, follow each nav link to its page and search there. Retry with
    the mobile menu opened. Finally fall back to a site-wide keyword scan on the home
    page."""

    async def reset_home() -> None:
        try:
            await page.goto(base_url, wait_until="domcontentloaded")
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_timeout(400)
            try:
                await page.evaluate(
                    """
                    () => {
                        const sdk = document.getElementById('onetrust-consent-sdk');
                        if (sdk) sdk.remove();
                        const filter = document.querySelector('.onetrust-pc-dark-filter');
                        if (filter) filter.remove();
                    }
                """
                )
            except Exception:
                pass
            await page.evaluate(SCROLL_JS)
        except Exception:
            pass

    async def open_menu_opener_index(menu_opener_index: int) -> bool:
        openers = await _collect_unique_menu_openers(page)
        if menu_opener_index < 0 or menu_opener_index >= len(openers):
            return False
        try:
            await openers[menu_opener_index].click(timeout=5000)
            await page.wait_for_timeout(480)
        except Exception:
            return False
        if not _urls_same_page(page.url, base_url):
            return False
        return True

    async def explore_nav_items(*, menu_opener_index: int | None) -> bool:
        await reset_home()
        if menu_opener_index is not None:
            if not await open_menu_opener_index(menu_opener_index):
                return False

        max_opt = 42

        # Pass 1 — same document: each top-level nav <li>, in order (hover → search subtree only).
        for i in range(max_opt):
            await reset_home()
            if menu_opener_index is not None:
                if not await open_menu_opener_index(menu_opener_index):
                    continue
            lis = await _collect_nav_top_level_lis(page)
            if i >= len(lis):
                break
            li_el = lis[i]
            try:
                try:
                    await li_el.scroll_into_view_if_needed()
                except Exception:
                    pass
                await li_el.hover(timeout=5000)
                await page.wait_for_timeout(320)
                if await find_and_click_staff_nav(page, container=li_el):
                    return True
            except Exception:
                continue

        # Pass 2 — same document: each visible nav anchor in order (hover parent <li> → subtree only).
        for i in range(max_opt):
            await reset_home()
            if menu_opener_index is not None:
                if not await open_menu_opener_index(menu_opener_index):
                    continue
            anchors = await _collect_nav_anchor_handles(page)
            if i >= len(anchors):
                break
            target = anchors[i]
            if await _try_staff_keyword_within_nav_option(page, target):
                return True

        # Pass 3 — follow each nav link; search the page we land on (subpages may say Staff / Directory).
        for i in range(max_opt):
            await reset_home()
            if menu_opener_index is not None:
                if not await open_menu_opener_index(menu_opener_index):
                    continue
            anchors = await _collect_nav_anchor_handles(page)
            if i >= len(anchors):
                break
            target = anchors[i]
            if not await _click_nav_link_expect_load(page, target):
                continue
            try:
                await page.evaluate(
                    """
                    () => {
                        const sdk = document.getElementById('onetrust-consent-sdk');
                        if (sdk) sdk.remove();
                    }
                """
                )
            except Exception:
                pass
            if await _search_current_page_for_staff_keywords(page):
                return True
        return False

    if await explore_nav_items(menu_opener_index=None):
        return True

    await reset_home()
    openers = await _collect_unique_menu_openers(page)
    for oidx in range(min(len(openers), 10)):
        if await explore_nav_items(menu_opener_index=oidx):
            return True

    if not _urls_same_page(page.url, base_url):
        await reset_home()
    return await find_and_click_staff_nav(page, container=None)


async def process_team(
    page,
    tier: str,
    league: str,
    team_name: str,
    website: str,
    *,
    max_seconds: float,
    max_buttons: int,
    max_name_clicks: int,
    max_expand_rounds: int,
) -> None:
    if not website:
        append_flagged_row(tier, league, team_name, website, "error")
        return

    response = None
    try:
        response = await page.goto(website, wait_until="domcontentloaded")
    except Exception:
        append_flagged_row(tier, league, team_name, website, "error")
        return

    try:
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(500)
        try:
            await page.evaluate("""
                () => {
                    const sdk = document.getElementById('onetrust-consent-sdk');
                    if (sdk) sdk.remove();
                    const filter = document.querySelector('.onetrust-pc-dark-filter');
                    if (filter) filter.remove();
                }
            """)
        except Exception:
            pass
        await page.evaluate(SCROLL_JS)
    except Exception:
        pass

    if await _is_bad_website_landing(page, response):
        append_flagged_row(tier, league, team_name, website, BAD_WEBSITE_REASON)
        return

    try:
        found = await find_staff_nav_with_menu_exploration(page, website)
    except Exception:
        append_flagged_row(tier, league, team_name, website, "error")
        return

    if not found:
        append_flagged_row(
            tier, league, team_name, website, FLAG_NO_KEYWORD_NAV,
        )
        return

    try:
        rows, source_url = await scrape_emails_from_loaded_page(
            page,
            max_seconds=max_seconds,
            max_buttons=max_buttons,
            max_name_clicks=max_name_clicks,
            max_expand_rounds=max_expand_rounds,
        )
    except Exception:
        append_flagged_row(tier, league, team_name, website, "error")
        return

    emails_written = 0
    for r in rows:
        r.setdefault("Name", "")
        r.setdefault("Title", "")
        r.setdefault("Phone", "")
        em = (r.get("Email") or "").strip()
        if not em:
            continue
        append_staff_email_row(tier, league, team_name, em, source_url)
        emails_written += 1

    if emails_written == 0:
        append_flagged_row(tier, league, team_name, website, "no_emails")


async def run_batch(
    input_csv: Path,
    *,
    max_seconds: float,
    max_buttons: int,
    max_name_clicks: int,
    max_expand_rounds: int,
    headless: bool,
    limit: int = 0,
) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print(
            "Playwright not installed. Run: pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        sys.exit(1)

    if not input_csv.is_file():
        print(f"Input CSV not found: {input_csv}", file=sys.stderr)
        sys.exit(1)

    teams: list[tuple[str, str, str, str]] = []
    with open(input_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tier, league, team_name, website = _normalize_team_row(row)
            if not team_name and not website:
                continue
            teams.append((tier, league, team_name, website))

    if limit and limit > 0:
        teams = teams[:limit]
        print(f"TEST MODE: processing first {len(teams)} row(s) only (--limit {limit})", flush=True)

    n_teams = len(teams)
    print(f"Loaded {n_teams} teams from:\n  {input_csv}", flush=True)
    if n_teams < 120 and input_csv.resolve() == INPUT_TEAMS_CSV.resolve():
        print(
            f"NOTE: {n_teams} rows in {input_csv.name} (FBS/FCS subset). "
            f"Full NCAA list: {MASTER_TEAMS_CSV.name}.",
            file=sys.stderr,
            flush=True,
        )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        try:
            context = await browser.new_context()
            await context.grant_permissions(["clipboard-read"])
            page = await context.new_page()
            for tier, league, team_name, website in teams:
                print(f"Processing: {team_name} ({website})", flush=True)
                await process_team(
                    page,
                    tier,
                    league,
                    team_name,
                    website,
                    max_seconds=max_seconds,
                    max_buttons=max_buttons,
                    max_name_clicks=max_name_clicks,
                    max_expand_rounds=max_expand_rounds,
                )
        finally:
            await browser.close()

    print(f"Done. Staff emails: {STAFF_EMAILS_CSV}")
    print(f"Flagged: {FLAGGED_CSV}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="CSV-driven mailto scrape: homepage → staff keyword button/link → emails",
    )
    parser.add_argument("--max-seconds", type=float, default=10.0, help="Hard time budget per scrape (default: 10s)")
    parser.add_argument("--max-buttons", type=int, default=40, help="Max Email/ e-mail buttons (default: 40)")
    parser.add_argument("--max-name-clicks", type=int, default=35, help="Max name-link clicks when 0 emails (default: 35)")
    parser.add_argument("--max-expand-rounds", type=int, default=12, help="Max accordion open rounds (default: 12)")
    parser.add_argument("--show-browser", action="store_true", help="Show browser (default: headless)")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        metavar="N",
        help="Process only the first N rows (0 = all rows). Use --limit 1 to test one site.",
    )
    args = parser.parse_args()

    asyncio.run(
        run_batch(
            INPUT_TEAMS_CSV,
            max_seconds=max(1.0, float(args.max_seconds)),
            max_buttons=max(0, int(args.max_buttons)),
            max_name_clicks=max(0, int(args.max_name_clicks)),
            max_expand_rounds=max(0, int(args.max_expand_rounds)),
            headless=not bool(args.show_browser),
            limit=max(0, int(args.limit)),
        )
    )


if __name__ == "__main__":
    main()
