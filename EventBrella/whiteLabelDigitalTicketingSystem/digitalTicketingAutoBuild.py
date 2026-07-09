#!/usr/bin/env python3
"""
digitalTicketingAutoBuild.py
Auto-populates the white-label ticketing form with event data, triggers prompt
generation, and saves the Cursor prompt to a text file.

Usage:
  python digitalTicketingAutoBuild.py [--data event-data.json] [--form path/to/white-label-form.html] [--output prompt.txt] [--headed]

Requires: pip install playwright && playwright install chromium
"""

import argparse
import json
import os
import sys
from pathlib import Path


def load_event_data(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_automation(
    form_html_path: Path,
    data: dict,
    output_path: Path,
    headed: bool = False,
) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run: pip install playwright && playwright install chromium")
        sys.exit(1)

    form_url = form_html_path.as_uri()
    identity = data.get("identity", {})
    venue = data.get("venue", {})
    contact = data.get("contact", {})
    tiers = data.get("tiers", [])

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed)
        page = browser.new_page()
        page.goto(form_url, wait_until="domcontentloaded")
        page.wait_for_selector("#whiteLabelForm", state="visible", timeout=10000)

        # —— 1. Identity & Branding (panel 1 is usually open) ——
        page.fill('input[name="CLIENT_NAME"]', identity.get("CLIENT_NAME", ""))
        page.fill('input[name="CLIENT_ORGANIZER_NAME"]', identity.get("CLIENT_ORGANIZER_NAME", ""))
        page.fill('input[name="CLIENT_EVENT_NAME"]', identity.get("CLIENT_EVENT_NAME", ""))
        page.fill('input[name="CLIENT_EVENT_DATE"]', identity.get("CLIENT_EVENT_DATE", ""))
        page.select_option("#CLIENT_EVENT_START_TIME", identity.get("CLIENT_EVENT_START_TIME", ""))
        page.select_option("#CLIENT_EVENT_END_TIME", identity.get("CLIENT_EVENT_END_TIME", ""))
        page.fill('textarea[name="CLIENT_EVENT_DESCRIPTION"]', identity.get("CLIENT_EVENT_DESCRIPTION", ""))

        # —— 2. Venue & Location ——
        page.click('[data-accordion="2"]')
        page.wait_for_timeout(200)
        page.fill('input[name="CLIENT_VENUE_NAME"]', venue.get("CLIENT_VENUE_NAME", ""))
        page.fill('input[name="CLIENT_ADDRESS_LINE1"]', venue.get("CLIENT_ADDRESS_LINE1", ""))
        page.fill('input[name="CLIENT_ADDRESS_LINE2"]', venue.get("CLIENT_ADDRESS_LINE2", ""))
        page.fill('input[name="CLIENT_PHONE"]', venue.get("CLIENT_PHONE", ""))

        # —— 3. Contact & Web + points of contact ——
        page.click('[data-accordion="3"]')
        page.wait_for_timeout(200)
        page.fill('input[name="CLIENT_WEBSITE_URL"]', contact.get("CLIENT_WEBSITE_URL", ""))
        page.fill('input[name="CLIENT_CONTACT_EMAIL"]', contact.get("CLIENT_CONTACT_EMAIL", ""))

        for i, c in enumerate(contact.get("contacts", []), start=1):
            page.click("#btnAddContact")
            page.wait_for_timeout(150)
            page.fill(f'input[name="contactName_{i}"]', c.get("name", ""))
            page.fill(f'input[name="contactEmail_{i}"]', c.get("email", ""))
            page.fill(f'input[name="contactPhone_{i}"]', c.get("phone", ""))
            page.fill(f'input[name="contactRole_{i}"]', c.get("role", ""))

        # —— 4. Ticketing Tiers ——
        page.click('[data-accordion="4"]')
        page.wait_for_timeout(200)

        for i, t in enumerate(tiers, start=1):
            page.click("#btnAddTier")
            page.wait_for_timeout(150)
            page.fill(f'input[name="tierName_{i}"]', t.get("name", ""))
            page.fill(f'input[name="tierId_{i}"]', t.get("id", ""))
            page.fill(f'input[name="tierPrice_{i}"]', str(t.get("price", "")))
            page.fill(f'input[name="tierCapacity_{i}"]', str(t.get("capacity", "")))
            page.fill(f'textarea[name="tierDescription_{i}"]', t.get("description", ""))

        # —— Generate prompt ——
        page.click("#btnSubmitForm")
        page.wait_for_timeout(800)

        preview = page.query_selector("#previewOutput")
        if not preview:
            raise RuntimeError("Preview section #previewOutput not found after submit.")

        prompt_text = preview.inner_text()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(prompt_text, encoding="utf-8")
    print(f"Prompt saved to: {output_path}")


def main():
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Auto-fill white-label form and save Cursor prompt.")
    parser.add_argument(
        "--data",
        type=Path,
        default=script_dir / "event-data.json",
        help="Path to event-data.json",
    )
    parser.add_argument(
        "--form",
        type=Path,
        default=script_dir / "white-label-form.html",
        help="Path to white-label-form.html",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output prompt file path (default: from event-data.json or itll-happen-boyz-showcase-cursor-prompt.txt)",
    )
    parser.add_argument("--headed", action="store_true", help="Run browser visible (not headless).")
    args = parser.parse_args()

    if not args.form.exists():
        print(f"Form not found: {args.form}")
        sys.exit(1)
    if not args.data.exists():
        print(f"Data file not found: {args.data}")
        sys.exit(1)

    data = load_event_data(args.data)
    output_path = args.output or script_dir / data.get("output_prompt_filename", "itll-happen-boyz-showcase-cursor-prompt.txt")

    run_automation(
        form_html_path=args.form,
        data=data,
        output_path=output_path,
        headed=args.headed,
    )


if __name__ == "__main__":
    main()
