#!/usr/bin/env python3
"""
Diagnostic script — run this to pinpoint where scrape-mailto.py silently fails
on MiLB front office pages.

Usage: python diagnose-milb.py "https://www.milb.com/brooklyn/about/frontoffice"
"""

import re
import sys
import time
from playwright.sync_api import sync_playwright

EMAIL_BUTTON_LABEL_RE = re.compile(r"^e[\s.-]*mail(?:\s+|:\s*)", re.I)

SCROLL_JS = r"""
async () => {
  const step = 400; const pause = 100;
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
    if (s) { try { s.click(); opened++; } catch (e) {} }
  });
  return opened;
}
"""

url = sys.argv[1] if len(sys.argv) > 1 else "https://www.milb.com/brooklyn/about/frontoffice"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.set_default_navigation_timeout(20000)
    page.set_default_timeout(20000)

    print(f"\n[1] Loading: {url}")
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(5000)
    page.evaluate(SCROLL_JS)
    print("    Page loaded and scrolled.")

    print("\n[2] Expanding accordions...")
    for round_num in range(12):
        opened = int(page.evaluate(EXPAND_COLLAPSED_JS) or 0)
        print(f"    Round {round_num + 1}: opened {opened} accordion(s)")
        if opened == 0:
            break
        page.wait_for_timeout(400)

    page.wait_for_timeout(1000)
    page.evaluate(SCROLL_JS)
    page.wait_for_timeout(500)
    print("    Done expanding.")

    print("\n[3] Checking for Cloudflare email-protection links...")
    cf = page.evaluate("() => document.querySelectorAll('a[href*=\"cdn-cgi/l/email-protection\"]').length")
    print(f"    Cloudflare obfuscated links found: {cf}")

    print("\n[4] Querying all <a> and <button> elements...")
    handles = page.query_selector_all("a, button")
    print(f"    Total a/button elements: {len(handles)}")

    print("\n[5] Filtering for E-Mail/Email [Name] buttons...")
    matched = []
    for el in handles:
        try:
            txt = (el.inner_text() or "").replace("\n", " ").strip()
            if EMAIL_BUTTON_LABEL_RE.match(txt):
                matched.append((el, txt))
                print(f"    MATCH: '{txt}'")
        except Exception as e:
            pass

    print(f"\n    Matched button count: {len(matched)}")

    if not matched:
        print("\n[!] No matched buttons — checking raw page text for 'e-mail' or 'email'...")
        body = page.evaluate("() => document.body.innerText")
        hits = re.findall(r"e[\s.-]*mail\s+\w+", body, re.I)
        print(f"    Raw text hits: {hits[:20]}")

        print("\n[!] Checking all button/link text on page (first 40)...")
        sample = []
        for el in handles[:200]:
            try:
                txt = (el.inner_text() or "").replace("\n", " ").strip()
                if txt:
                    sample.append(txt)
            except:
                pass
        for t in sample[:40]:
            print(f"    '{t}'")
    else:
        print("\n[6] Attempting mailto intercept on first matched button...")
        el, label = matched[0]
        intercepted = []

        def handle_mailto(request):
            if request.url.lower().startswith("mailto:"):
                intercepted.append(request.url)
                print(f"    [REQUEST INTERCEPTED] {request.url}")

        page.on("request", handle_mailto)
        try:
            el.click()
            page.wait_for_timeout(1500)
        except Exception as e:
            print(f"    Click error: {e}")
        finally:
            try:
                page.remove_listener("request", handle_mailto)
            except:
                pass

        print(f"    page.url after click: {page.url}")
        print(f"    Intercepted requests: {intercepted}")

        if not intercepted:
            print("\n[!] No mailto: intercepted. Checking href attribute directly...")
            href = el.get_attribute("href") or ""
            print(f"    href: '{href}'")
            print("\n[!] Checking onclick attribute...")
            onclick = el.get_attribute("onclick") or ""
            print(f"    onclick: '{onclick}'")

    print("\n[7] Checking plain mailto: links in DOM...")
    mailto_count = page.evaluate("() => document.querySelectorAll('a[href^=\"mailto:\"]').length")
    print(f"    Plain mailto: links in DOM: {mailto_count}")

    print("\nDone. Browser will stay open for 10 seconds for inspection.")
    time.sleep(10)
    browser.close()