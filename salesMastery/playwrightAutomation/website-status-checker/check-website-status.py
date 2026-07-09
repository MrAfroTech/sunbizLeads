#!/usr/bin/env python3
"""
Check whether Main Street America directory website URLs are active.

Reads Organization Name, State, and Website URL from MainStreetAmerica_Directory_Verified.xlsx
(sheets: State Coordinating Programs, Local Programs (Verified)), visits each URL with
Playwright (headless, sequential), and writes website_status_results.xlsx.

Active means a browser can reach and render meaningful page content — not strict HTTP 200.

Usage: python check-website-status.py [--limit N] [--show-browser] [--debug]
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
INPUT_XLSX = SCRIPT_DIR.parent / "MainStreetAmerica_Directory_Verified.xlsx"
OUTPUT_XLSX = SCRIPT_DIR / "website_status_results.xlsx"

SHEETS = ("State Coordinating Programs", "Local Programs (Verified)")
HEADER_ROW = 2

OUTPUT_COLUMNS = [
    "Organization Name",
    "State",
    "Website URL",
    "Active",
    "Status Code",
    "Final URL",
    "Page Title",
    "Error Type",
    "Notes",
]

NAVIGATION_TIMEOUT_MS = 15_000
POST_LOAD_WAIT_MS = 3_000
CLOUDFLARE_EXTRA_WAIT_MS = 5_000
MIN_BODY_CHARS_YES = 100
MIN_BODY_CHARS_WEAK_YES = 40

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

CLOUDFLARE_TITLE_HINTS = (
    "checking your browser",
    "just a moment",
    "attention required",
    "please wait",
    "ddos protection",
)
CLOUDFLARE_BODY_HINTS = (
    "cf-browser-verification",
    "challenge-platform",
    "cloudflare",
    "ray id",
)
HARD_FAIL_TITLE_HINTS = (
    "404 not found",
    "410 gone",
    "page not found",
    "site not found",
    "domain not found",
    "this site can't be reached",
    "err_name_not_resolved",
)


def _cell_str(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).strip()
    if text.lower() in ("nan", "none"):
        return ""
    return text


def _has_website_url(url: str) -> bool:
    return bool(_cell_str(url))


def normalize_url(url: str) -> str:
    url = _cell_str(url)
    if not url:
        return ""
    if not url.lower().startswith(("http://", "https://")):
        return f"https://{url}"
    return url


def url_variants(url: str) -> list[str]:
    """
    Build candidate URLs to try: original first, then https/http × bare/www domain.
    """
    normalized = normalize_url(url)
    if not normalized:
        return []

    parsed = urlparse(normalized)
    host = (parsed.hostname or "").lower()
    if not host:
        return [normalized]

    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"

    bare = host[4:] if host.startswith("www.") else host
    host_forms = [bare, f"www.{bare}"]

    candidates: list[str] = []
    seen: set[str] = set()

    def add(scheme: str, hostname: str) -> None:
        candidate = urlunparse((scheme, hostname, path, "", "", ""))
        if candidate not in seen:
            seen.add(candidate)
            candidates.append(candidate)

    add(parsed.scheme, host)
    for scheme in ("https", "http"):
        for hostname in host_forms:
            add(scheme, hostname)

    if normalized in seen:
        candidates.remove(normalized)
        candidates.insert(0, normalized)
    elif normalized not in candidates:
        candidates.insert(0, normalized)

    return candidates


def load_directory_rows() -> list[dict]:
    if not INPUT_XLSX.is_file():
        print(f"Missing input file: {INPUT_XLSX}", file=sys.stderr)
        sys.exit(1)

    rows: list[dict] = []
    for sheet in SHEETS:
        df = pd.read_excel(INPUT_XLSX, sheet_name=sheet, header=HEADER_ROW)
        for _, record in df.iterrows():
            org = _cell_str(record.get("Organization Name"))
            state = _cell_str(record.get("State"))
            website = _cell_str(record.get("Website URL"))
            if not org and not state and not website:
                continue
            rows.append({
                "Organization Name": org,
                "State": state,
                "Website URL": website,
            })
    return rows


def _require_playwright():
    try:
        from playwright.sync_api import Error as PlaywrightError
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
        return PlaywrightError, PlaywrightTimeoutError, sync_playwright
    except ImportError:
        print(
            "Playwright not installed. Run: pip install -r requirements.txt "
            "&& playwright install chromium",
            file=sys.stderr,
        )
        sys.exit(1)


def verify_playwright_browser(headless: bool = True) -> None:
    """Fail fast with a clear message if Chromium is not installed."""
    PlaywrightError, _, sync_playwright = _require_playwright()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            browser.close()
    except PlaywrightError as exc:
        if "executable doesn't exist" in str(exc).lower():
            print(
                "\nPlaywright Chromium is not installed for this Python environment.\n"
                "Run:\n"
                "  python3 -m playwright install chromium\n",
                file=sys.stderr,
            )
            sys.exit(1)
        raise


def classify_error_type(exc: BaseException | None, status: int | None = None) -> str:
    if exc is None and status in (404, 410):
        return "not_found"
    if exc is None:
        return ""

    msg = str(exc).lower()
    name = type(exc).__name__.lower()

    if "executable doesn't exist" in msg or "playwright install" in msg:
        return "browser_missing"
    if "err_name_not_resolved" in msg or "nxdomain" in msg or "dns" in msg:
        return "dns_failure"
    if "err_connection_refused" in msg or "connection refused" in msg:
        return "connection_refused"
    if "err_connection_timed_out" in msg or "timed out" in msg or "timeout" in name:
        return "timeout"
    if "err_ssl" in msg or "ssl" in msg or "cert" in msg:
        return "ssl_issue"
    if "net::err_" in msg:
        return "network_error"
    return "navigation_error"


def _is_cloudflare_interstitial(title: str, body: str) -> bool:
    title_l = (title or "").lower()
    body_l = (body or "").lower()[:2000]
    if any(hint in title_l for hint in CLOUDFLARE_TITLE_HINTS):
        return True
    return any(hint in body_l for hint in CLOUDFLARE_BODY_HINTS)


def _is_hard_fail_page(title: str, body: str, status: int | None) -> bool:
    title_l = (title or "").lower()
    if status in (404, 410):
        return True
    if any(hint in title_l for hint in HARD_FAIL_TITLE_HINTS):
        return True
    if status == 404 and len((body or "").strip()) < MIN_BODY_CHARS_WEAK_YES:
        return True
    return False


@dataclass
class PageSignals:
    attempted_url: str = ""
    final_url: str = ""
    status: int | None = None
    title: str = ""
    body_len: int = 0
    body_sample: str = ""
    nav_error: str = ""
    error_type: str = ""
    timed_out: bool = False
    redirected: bool = False
    cloudflare: bool = False
    notes: list[str] = field(default_factory=list)

    def add_note(self, note: str) -> None:
        if note and note not in self.notes:
            self.notes.append(note)


def _collect_page_signals(page, response, attempted_url: str) -> PageSignals:
    signals = PageSignals(attempted_url=attempted_url)
    signals.status = response.status if response else None
    signals.final_url = page.url or attempted_url
    signals.redirected = _normalize_compare_url(signals.final_url) != _normalize_compare_url(
        attempted_url
    )

    try:
        signals.title = (page.title() or "").strip()
    except Exception:
        signals.title = ""

    try:
        body = page.locator("body").inner_text(timeout=8_000)
        signals.body_sample = body.strip()[:300]
        signals.body_len = len(body.strip())
    except Exception:
        signals.body_len = 0

    if _is_cloudflare_interstitial(signals.title, signals.body_sample):
        signals.cloudflare = True
        signals.add_note("cloudflare/interstitial detected")
    return signals


def _normalize_compare_url(url: str) -> str:
    parsed = urlparse(url.lower().rstrip("/"))
    host = parsed.hostname or ""
    if host.startswith("www."):
        host = host[4:]
    return f"{parsed.scheme}://{host}{parsed.path}"


def evaluate_active(signals: PageSignals) -> tuple[str, str]:
    """
    Return (Active YES/NO, Notes).
    Uses status, redirects, DOM content, and Cloudflare handling.
    """
    status = signals.status
    body_len = signals.body_len
    title = signals.title

    if signals.redirected:
        signals.add_note("redirected successfully")

    if signals.cloudflare and body_len >= MIN_BODY_CHARS_YES:
        signals.add_note("cloudflare/interstitial passed")
        return "YES", "; ".join(signals.notes) or "cloudflare/interstitial passed"

    if status is not None and 200 <= status < 400:
        if body_len >= MIN_BODY_CHARS_YES:
            return "YES", "; ".join(signals.notes) or "page loaded successfully"
        if body_len >= MIN_BODY_CHARS_WEAK_YES and title and status < 400:
            signals.add_note("minimal content rendered")
            return "YES", "; ".join(signals.notes)

    if status in (403, 404, 410):
        if status == 403 and signals.cloudflare and body_len >= MIN_BODY_CHARS_YES:
            return "YES", "; ".join(signals.notes) or "cloudflare/interstitial passed"
        if status in (404, 410) or _is_hard_fail_page(title, signals.body_sample, status):
            return "NO", "; ".join(signals.notes) or f"HTTP {status}"
        if status == 403 and body_len < MIN_BODY_CHARS_YES:
            return "NO", "; ".join(signals.notes) or "HTTP 403 forbidden"

    if body_len >= MIN_BODY_CHARS_YES:
        if status is None:
            signals.add_note("rendered content despite missing response status")
        elif status and status >= 400 and not signals.cloudflare:
            signals.add_note(f"rendered content despite HTTP {status}")
        if signals.timed_out:
            signals.add_note("rendered content despite timeout")
        return "YES", "; ".join(signals.notes) or "meaningful page content detected"

    if signals.timed_out and signals.redirected and body_len >= MIN_BODY_CHARS_WEAK_YES:
        signals.add_note("rendered content despite timeout")
        return "YES", "; ".join(signals.notes)

    if body_len >= MIN_BODY_CHARS_WEAK_YES and title and (status is None or status < 400):
        lowered = title.lower()
        if not any(hint in lowered for hint in HARD_FAIL_TITLE_HINTS):
            signals.add_note("page title and partial content present")
            return "YES", "; ".join(signals.notes)

    if status is not None and status >= 500 and body_len < MIN_BODY_CHARS_WEAK_YES:
        return "NO", "; ".join(signals.notes) or f"HTTP {status}"

    if status is not None and 400 <= status < 500 and body_len < MIN_BODY_CHARS_WEAK_YES:
        return "NO", "; ".join(signals.notes) or f"HTTP {status}"

    if signals.error_type in ("dns_failure", "connection_refused", "browser_missing"):
        return "NO", "; ".join(signals.notes) or signals.nav_error[:200]

    if signals.timed_out and body_len < MIN_BODY_CHARS_WEAK_YES:
        return "NO", "; ".join(signals.notes) or "navigation timeout"

    if signals.nav_error:
        return "NO", "; ".join(signals.notes) or signals.nav_error[:200]

    return "NO", "; ".join(signals.notes) or "no meaningful content detected"


def _wait_for_cloudflare(page, signals: PageSignals) -> PageSignals:
    if not signals.cloudflare:
        return signals
    try:
        page.wait_for_timeout(CLOUDFLARE_EXTRA_WAIT_MS)
    except Exception:
        pass
    refreshed = _collect_page_signals(page, None, signals.attempted_url)
    refreshed.cloudflare = signals.cloudflare
    refreshed.notes = list(signals.notes)
    if refreshed.body_len >= MIN_BODY_CHARS_YES:
        refreshed.add_note("cloudflare/interstitial passed")
    return refreshed


def _attempt_navigation(page, url: str, PlaywrightTimeoutError) -> tuple[Any, PageSignals]:
    signals = PageSignals(attempted_url=url)
    response = None
    try:
        response = page.goto(url, wait_until="domcontentloaded")
        signals.status = response.status if response else None
        signals.final_url = page.url or url
    except PlaywrightTimeoutError as exc:
        signals.timed_out = True
        signals.nav_error = str(exc).strip()
        signals.error_type = classify_error_type(exc)
        signals.add_note("navigation timeout (partial load may exist)")
    except Exception as exc:
        signals.nav_error = str(exc).strip()
        signals.error_type = classify_error_type(exc)
        signals.final_url = page.url or url
        if signals.final_url and signals.final_url != "about:blank":
            signals.add_note("partial navigation before error")

    try:
        page.wait_for_timeout(POST_LOAD_WAIT_MS)
    except Exception:
        pass

    collected = _collect_page_signals(page, response, url)
    collected.timed_out = signals.timed_out
    collected.nav_error = signals.nav_error or collected.nav_error
    collected.error_type = signals.error_type or classify_error_type(None, collected.status)
    collected.notes.extend(signals.notes)

    if collected.cloudflare:
        collected = _wait_for_cloudflare(page, collected)

    return response, collected


def check_website_active(
    original_url: str,
    context,
    *,
    debug: bool = False,
) -> dict:
    """Try URL variants on a shared browser context; return result row fields."""
    PlaywrightError, PlaywrightTimeoutError, _ = _require_playwright()

    normalized = normalize_url(original_url)
    variants = url_variants(original_url)
    best_signals: PageSignals | None = None
    best_active = "NO"
    best_notes = ""

    for candidate in variants:
        page = context.new_page()
        page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
        page.set_default_timeout(NAVIGATION_TIMEOUT_MS)

        if debug:
            print(f"    [try] {candidate}")

        try:
            _, signals = _attempt_navigation(page, candidate, PlaywrightTimeoutError)
        except PlaywrightError as exc:
            signals = PageSignals(
                attempted_url=candidate,
                nav_error=str(exc).strip(),
                error_type=classify_error_type(exc),
            )
        except Exception as exc:
            signals = PageSignals(
                attempted_url=candidate,
                nav_error=str(exc).strip(),
                error_type=classify_error_type(exc),
            )
        finally:
            page.close()

        active, notes = evaluate_active(signals)

        if debug:
            _print_debug_probe(original_url, normalized, signals, active, notes)

        if active == "YES":
            return _signals_to_result(signals, active, notes)

        if best_signals is None or signals.body_len > best_signals.body_len:
            best_signals = signals
            best_active = active
            best_notes = notes

    assert best_signals is not None
    return _signals_to_result(best_signals, best_active, best_notes)


def _signals_to_result(signals: PageSignals, active: str, notes: str) -> dict:
    status_str = str(signals.status) if signals.status is not None else ""
    return {
        "Active": active,
        "Status Code": status_str,
        "Final URL": signals.final_url or "",
        "Page Title": signals.title[:200] if signals.title else "",
        "Error Type": signals.error_type or classify_error_type(None, signals.status),
        "Notes": notes[:500] if notes else "",
        "_signals": signals,
    }


def print_failure_diagnosis(
    org: str,
    original_url: str,
    result: dict,
) -> None:
    signals: PageSignals | None = result.get("_signals")
    print("\n  --- failure diagnosis ---")
    print(f"  Organization:      {org}")
    print(f"  Original URL:      {original_url}")
    print(f"  Normalized URL:    {normalize_url(original_url)}")
    print(f"  Final URL:         {result.get('Final URL', '')}")
    print(f"  Status code:       {result.get('Status Code', '')}")
    print(f"  Page title:        {result.get('Page Title', '')}")
    print(f"  Error type:        {result.get('Error Type', '')}")
    print(f"  Notes:             {result.get('Notes', '')}")
    if signals:
        print(f"  Body text length:  {signals.body_len}")
        print(f"  Nav exception:     {signals.nav_error[:300] if signals.nav_error else '(none)'}")
        rendered = signals.body_len >= MIN_BODY_CHARS_WEAK_YES
        print(f"  Body rendered:     {'yes' if rendered else 'no'}")
    print("  -------------------------\n")


def _print_debug_probe(
    original_url: str,
    normalized: str,
    signals: PageSignals,
    active: str,
    notes: str,
) -> None:
    print(f"    status={signals.status} final={signals.final_url}")
    print(f"    title={signals.title[:80]!r} body_len={signals.body_len}")
    if signals.redirected:
        print("    redirected=True")
    if signals.cloudflare:
        print("    cloudflare=True")
    if signals.nav_error:
        print(f"    exception={signals.nav_error[:200]}")
    print(f"    -> {active} ({notes})")


def process_rows(
    rows: list[dict],
    *,
    headless: bool = True,
    debug: bool = False,
) -> list[dict]:
    PlaywrightError, _, sync_playwright = _require_playwright()
    results: list[dict] = []
    total_with_url = sum(1 for r in rows if _has_website_url(r.get("Website URL", "")))

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=headless)
        except PlaywrightError as exc:
            if "executable doesn't exist" in str(exc).lower():
                print(
                    "\nPlaywright browser not installed. Run:\n"
                    "  playwright install chromium\n",
                    file=sys.stderr,
                )
            raise

        context = browser.new_context(user_agent=USER_AGENT)
        try:
            for row in rows:
                org = row["Organization Name"]
                state = row["State"]
                website = row["Website URL"]

                out: dict = {
                    "Organization Name": org,
                    "State": state,
                    "Website URL": website,
                    "Active": "",
                    "Status Code": "",
                    "Final URL": "",
                    "Page Title": "",
                    "Error Type": "",
                    "Notes": "",
                }

                if not _has_website_url(website):
                    out["Active"] = "NO URL"
                    results.append(out)
                    print(f"[skip] {org or '(unknown)'} ({state}): no website URL")
                    continue

                checked_so_far = sum(
                    1 for r in results if r.get("Active") not in ("", "NO URL")
                ) + 1
                url = normalize_url(website)
                print(f"[check {checked_so_far}/{total_with_url}] {org} ({state}): {url}")

                try:
                    status = check_website_active(website, context, debug=debug)
                except Exception as exc:
                    status = {
                        "Active": "NO",
                        "Status Code": "",
                        "Final URL": "",
                        "Page Title": "",
                        "Error Type": classify_error_type(exc),
                        "Notes": str(exc).strip()[:200] or "check failed",
                    }

                signals = status.pop("_signals", None)
                out.update(status)
                results.append(out)

                note_suffix = f" ({out['Notes']})" if out.get("Notes") else ""
                print(f"  -> {out['Active']}{note_suffix}")

                if out["Active"] == "NO":
                    diag = dict(out)
                    if signals:
                        diag["_signals"] = signals
                    print_failure_diagnosis(org, website, diag)
        finally:
            context.close()
            browser.close()

    return results


def write_results(rows: list[dict], output_path: Path) -> None:
    df = pd.DataFrame(rows, columns=OUTPUT_COLUMNS)
    for col in OUTPUT_COLUMNS:
        if col in df.columns:
            df[col] = df[col].fillna("").astype(str).replace("nan", "")
    df.to_excel(output_path, index=False, sheet_name="Website Status")


def print_summary(rows: list[dict]) -> None:
    total = len(rows)
    no_url = sum(1 for r in rows if r.get("Active") == "NO URL")
    checked = [r for r in rows if r.get("Active") not in ("", "NO URL")]
    yes_count = sum(1 for r in checked if r.get("Active") == "YES")
    no_count = sum(1 for r in checked if r.get("Active") == "NO")

    print()
    print("--- Summary ---")
    print(f"Total rows:     {total}")
    print(f"Total checked:  {len(checked)}")
    print(f"Total YES:      {yes_count}")
    print(f"Total NO:       {no_count}")
    print(f"Total NO URL:   {no_url}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check Main Street America directory website URLs for active status",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Process at most this many rows with URLs to check (0 = all)",
    )
    parser.add_argument(
        "--show-browser",
        action="store_true",
        help="Show browser window (slower). Default is headless.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print redirects, final URL, title, body length, and exceptions per attempt",
    )
    args = parser.parse_args()
    _require_playwright()
    verify_playwright_browser(headless=not bool(args.show_browser))

    started = time.monotonic()
    rows = load_directory_rows()

    if args.limit and int(args.limit) > 0:
        limited: list[dict] = []
        url_checks = 0
        for row in rows:
            limited.append(row)
            if _has_website_url(row.get("Website URL", "")):
                url_checks += 1
                if url_checks >= int(args.limit):
                    break
        rows = limited

    results = process_rows(
        rows,
        headless=not bool(args.show_browser),
        debug=bool(args.debug),
    )
    write_results(results, OUTPUT_XLSX)
    print_summary(results)
    elapsed = time.monotonic() - started
    print(f"\nDone in {elapsed:.1f}s. Output: {OUTPUT_XLSX}")


if __name__ == "__main__":
    main()
