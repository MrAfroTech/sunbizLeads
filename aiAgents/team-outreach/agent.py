#!/usr/bin/env python3
"""
Team Outreach Agent
Reads targets from CSV (baseball_leagues_fixed.csv: team_name, website).
Navigates to each team website, finds About/Contact page, scrapes emails and decision
makers, finds contact form, fills and submits. Writes results to Google Sheet.
Visible browser. Pauses on CAPTCHA for manual solve + Resume.
Uses config.py and db.py.
"""
import csv
import logging
import os
import random
import re
import time
import tkinter as tk
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from tkinter import messagebox

import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from playwright.sync_api import sync_playwright

import config
import db

SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(SCRIPT_DIR / ".env")
CSV_PATH = SCRIPT_DIR / "baseball_leagues_fixed.csv"
LOG_FILE = SCRIPT_DIR / "outreach.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Sheet output columns (after Team Name / Website URL if present)
OUTPUT_COLUMNS = [
    "Emails Found",
    "Decision Makers Found",
    "Form Page URL",
    "Form Submitted",
    "CAPTCHA Flagged",
    "Needs Human Follow-Up",
    "Timestamp",
]

# Decision-maker title patterns (case-insensitive)
DECISION_TITLES = [
    r"\bGM\b",
    r"\bPresident\b",
    r"\bDirector\s+of\s+Partnerships\b",
    r"\bHead\s+of\s+Operations\b",
    r"\bBusiness\s+Development\b",
    r"\bExecutive\s+Director\b",
]

# Contact/About page link text (case-insensitive)
CONTACT_LINK_KEYWORDS = [
    "contact",
    "contact us",
    "about",
    "about us",
    "get in touch",
    "reach us",
]

# CAPTCHA detection selectors
CAPTCHA_SELECTORS = [
    '[src*="recaptcha"]',
    '[src*="hcaptcha"]',
    'iframe[title*="reCAPTCHA"]',
    'iframe[title*="hCaptcha"]',
    '.g-recaptcha',
    '#g-recaptcha',
    '[data-sitekey]',
    '.h-captcha',
]


def get_sheets_client() -> Tuple[Any, str]:
    """Return authenticated gspread client and sheet_id from SHEET_ID in .env."""
    sheet_id = os.environ.get("SHEET_ID")
    if not sheet_id or sheet_id == "your_google_sheet_id_here":
        raise ValueError("Set SHEET_ID in .env to your Google Sheet ID")
    creds_path = os.environ.get("GOOGLE_CREDENTIALS_PATH")
    if not creds_path:
        creds_path = SCRIPT_DIR / "credentials" / "google-sheets-service-account.json"
    else:
        p = Path(creds_path)
        creds_path = SCRIPT_DIR / p if not p.is_absolute() else p
    if not Path(creds_path).exists():
        raise FileNotFoundError(f"Google credentials not found at {creds_path}")
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    creds = Credentials.from_service_account_file(str(creds_path), scopes=scopes)
    return gspread.authorize(creds), sheet_id


def ensure_output_columns(worksheet) -> Dict[str, int]:
    """Ensure sheet has Team Name column and OUTPUT_COLUMNS. Return header -> 1-based col index."""
    headers = worksheet.row_values(1)
    if not headers:
        headers = []
    required = ["Team Name"] + OUTPUT_COLUMNS
    to_add = [c for c in required if c not in headers]
    if to_add:
        start = len(headers)
        for i, col in enumerate(to_add):
            worksheet.update_cell(1, start + i + 1, col)
        time.sleep(1.5)
        headers = worksheet.row_values(1)
    return {h: i + 1 for i, h in enumerate(headers)}


def load_existing_rows(worksheet, col_map: Dict[str, int]) -> Dict[str, int]:
    """Return mapping team_name -> 1-based row index. Uses Team Name column from col_map."""
    team_col = col_map.get("Team Name", 1)
    col_values = worksheet.col_values(team_col)
    mapping: Dict[str, int] = {}
    for idx, val in enumerate(col_values, start=1):
        name = (val or "").strip()
        if name and idx > 1:
            mapping[name] = idx
    return mapping


def write_row_to_sheet(
    worksheet,
    col_map: Dict[str, int],
    existing: Dict[str, int],
    team_name: str,
    result: Dict[str, str],
) -> None:
    """Update existing row by Team Name or append."""
    row_idx = existing.get(team_name)
    if row_idx is not None:
        for col_name in OUTPUT_COLUMNS:
            if col_name in col_map and col_name in result:
                worksheet.update_cell(row_idx, col_map[col_name], result[col_name])
    else:
        row = [team_name] + [result.get(c, "") for c in OUTPUT_COLUMNS]
        worksheet.append_row(row)
        # Track new row so same team name in same run updates instead of re-appending
        existing[team_name] = len(existing) + 2
    time.sleep(0.5)


def extract_emails(text: str) -> List[str]:
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    return list(set(re.findall(pattern, text)))


def extract_decision_makers(text: str) -> List[str]:
    results: List[str] = []
    for pat in DECISION_TITLES:
        for m in re.finditer(pat, text, re.IGNORECASE):
            before = text[max(0, m.start() - 50) : m.start()].strip()
            words = before.split()
            name = " ".join(words[-3:]) if len(words) >= 2 else before
            title = m.group(0)
            if name and len(name) > 2:
                results.append(f"{name} - {title}")
    return list(dict.fromkeys(results))


def _resolve_url(href: str, base: str) -> Optional[str]:
    href = (href or "").strip()
    if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
        return None
    if href.startswith("http"):
        return href
    base = base.rstrip("/")
    if href.startswith("/"):
        m = re.match(r"(https?)://([^/]+)", base)
        if m:
            return f"{m.group(1)}://{m.group(2)}{href}"
    return f"{base}/{href.lstrip('/')}"


def detect_captcha(page):
    try:
        for sel in CAPTCHA_SELECTORS:
            if page.query_selector(sel):
                return True
    except Exception:
        pass
    return False


def show_captcha_pause_dialog(team_name: str, for_form: bool = True):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    if for_form:
        msg = (
            f"CAPTCHA detected on {team_name}. Solve the CAPTCHA in the browser, "
            "then click OK to submit and continue."
        )
    else:
        msg = (
            f"CAPTCHA detected on {team_name}. Solve the CAPTCHA in the browser, "
            "then click OK to continue."
        )
    messagebox.showinfo("CAPTCHA Detected", msg, parent=root)
    root.destroy()


def find_contact_or_about_link(page, base_url: str) -> bool:
    """
    Scan nav and footer for a link whose visible text matches CONTACT_LINK_KEYWORDS.
    Click the first match and return True. Return False if none found.
    """
    try:
        links = page.query_selector_all("a[href]")
        for a in links:
            try:
                text = (a.inner_text() or "").strip().lower()
                if not text:
                    continue
                if any(kw in text for kw in CONTACT_LINK_KEYWORDS):
                    href = a.get_attribute("href") or ""
                    url = _resolve_url(href, base_url)
                    if url and url.startswith("http"):
                        try:
                            page.goto(url, wait_until="domcontentloaded", timeout=10000)
                            page.wait_for_load_state("networkidle", timeout=8000)
                            return True
                        except Exception:
                            continue
            except Exception:
                continue
    except Exception:
        pass
    return False


def find_contact_form(page):
    """Locate a contact-style form (inputs for name, email, message)."""
    forms = page.query_selector_all("form")
    for form in forms:
        try:
            inputs = form.query_selector_all("input, textarea")
            types = set()
            for inp in inputs:
                t = (inp.get_attribute("type") or "text").lower()
                name = (inp.get_attribute("name") or inp.get_attribute("id") or "").lower()
                if t in ("text", "email", "tel") or "name" in name or "email" in name or "message" in name:
                    types.add("contact")
                if "message" in name or inp.tag_name.lower() == "textarea":
                    types.add("message")
            if "contact" in types and ("message" in types or len(inputs) >= 3):
                return form
        except Exception:
            continue
    return None


def map_form_fields(form):
    mapping = {}
    for inp in form.query_selector_all("input, textarea"):
        name = (inp.get_attribute("name") or inp.get_attribute("id") or "").lower()
        attr_type = (inp.get_attribute("type") or "text").lower()
        tag = inp.tag_name.lower()
        if tag == "textarea" or "message" in name or "comment" in name or "body" in name:
            mapping["message"] = inp
        elif "email" in name or attr_type == "email":
            mapping["email"] = inp
        elif "phone" in name or "tel" in name or attr_type == "tel":
            mapping["phone"] = inp
        elif "name" in name or "first" in name or "full" in name:
            mapping["name"] = inp
    return mapping


def fill_form(form, sender_name: str, sender_email: str, sender_phone: str, message: str):
    mapping = map_form_fields(form)
    if "name" in mapping:
        mapping["name"].fill(sender_name)
    if "email" in mapping:
        mapping["email"].fill(sender_email)
    if "phone" in mapping:
        mapping["phone"].fill(sender_phone)
    if "message" in mapping:
        mapping["message"].fill(message)


def submit_form(page, form):
    try:
        submit = form.query_selector('button[type="submit"], input[type="submit"], [type="submit"]')
        if not submit:
            submit = form.query_selector("button, input[type=submit]")
        if submit:
            submit.click()
            page.wait_for_load_state("networkidle", timeout=10000)
            return True, None
        return False, "No submit button found"
    except Exception as e:
        return False, str(e)


def _handle_initial_captcha(page, team_name: str):
    while detect_captcha(page):
        show_captcha_pause_dialog(team_name, for_form=False)


def _build_message(template: str, team_name: str, first_contact: str = "there") -> str:
    """Replace [TEAM_NAME], {org_name}, [FIRST_CONTACT] with team_name and first_contact."""
    t = template.replace("\\n", "\n")
    t = t.replace("[TEAM_NAME]", team_name).replace("{org_name}", team_name)
    t = t.replace("[FIRST_CONTACT]", first_contact)
    return t


def process_row(team_name: str, website_url: str, page) -> Tuple[Dict[str, str], str]:
    """
    Full flow: navigate → find About/Contact page → scrape emails & decision makers →
    find form → record Form Page URL → fill form → CAPTCHA check → submit.
    Returns (result_dict for sheet, status for db).
    """
    url = website_url.strip()
    if not url or not url.startswith("http"):
        url = "https://" + url

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result: Dict[str, str] = {
        "Emails Found": "",
        "Decision Makers Found": "",
        "Form Page URL": "",
        "Form Submitted": "No - Form Not Found",
        "CAPTCHA Flagged": "",
        "Needs Human Follow-Up": "",
        "Timestamp": timestamp,
    }

    logger.info("Processing: %s - %s", team_name, url)

    try:
        # 1. Navigate to website
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_load_state("networkidle", timeout=10000)
        result["Form Page URL"] = page.url
        _handle_initial_captcha(page, team_name)

        # 2. Find About/Contact page (nav and footer)
        if not find_contact_or_about_link(page, url):
            logger.warning("no_contact_page for %s", team_name)
            return result, db.STATUS_NO_CONTACT_PAGE

        # 3. On that page: scrape emails and decision makers
        body = page.inner_text("body") or ""
        emails = extract_emails(body)
        decision_makers = extract_decision_makers(body)
        result["Emails Found"] = ", ".join(emails)
        result["Decision Makers Found"] = ", ".join(decision_makers)

        # 4. Find contact form (on this page or one more Contact/About hop)
        form = find_contact_form(page)
        if not form:
            if find_contact_or_about_link(page, page.url):
                result["Form Page URL"] = page.url
                form = find_contact_form(page)
        if not form:
            logger.warning("no_form_found for %s", team_name)
            return result, db.STATUS_NO_FORM_FOUND

        result["Form Page URL"] = page.url

        # 5. Fill all fields first (before CAPTCHA check)
        first_contact = "there"
        if decision_makers:
            first_contact = decision_makers[0].split(" - ")[0].strip()
        message = _build_message(config.MESSAGE_TEMPLATE, team_name, first_contact)
        fill_form(form, config.SENDER_NAME, config.SENDER_EMAIL, config.SENDER_PHONE, message)

        # 6–7. CAPTCHA check then submit
        if detect_captcha(page):
            show_captcha_pause_dialog(team_name, for_form=True)
            success, err = submit_form(page, form)
            if success:
                result["Form Submitted"] = "Yes"
                return result, db.STATUS_SUBMITTED
            result["Form Submitted"] = "No - Error"
            result["CAPTCHA Flagged"] = "Yes"
            result["Needs Human Follow-Up"] = "Yes"
            logger.warning("Form submit failed after CAPTCHA: %s", err)
            return result, db.STATUS_ERROR

        # 8. No CAPTCHA: submit directly
        success, err = submit_form(page, form)
        if success:
            result["Form Submitted"] = "Yes"
            return result, db.STATUS_SUBMITTED
        result["Form Submitted"] = "No - Error"
        result["Needs Human Follow-Up"] = "Yes"
        logger.warning("Form submit failed: %s", err)
        return result, db.STATUS_ERROR

    except Exception as e:
        logger.exception("Error for %s: %s", team_name, e)
        result["Form Submitted"] = "No - Error"
        result["Needs Human Follow-Up"] = "Yes"
        result["Timestamp"] = timestamp
        return result, db.STATUS_ERROR


def main():
    logger.info("Team Outreach Agent starting")
    if not all([config.SENDER_NAME, config.SENDER_EMAIL]):
        raise ValueError("Set SENDER_NAME and SENDER_EMAIL in .env")

    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found: {CSV_PATH}")

    db.init_db()
    client, sheet_id = get_sheets_client()
    worksheet = client.open_by_key(sheet_id).sheet1
    col_map = ensure_output_columns(worksheet)
    existing_rows = load_existing_rows(worksheet, col_map)

    rows = []
    with CSV_PATH.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            team_name = (row.get("team_name") or "").strip()
            website = (row.get("website") or "").strip()
            if team_name and website:
                rows.append({"team_name": team_name, "website": website})

    if not rows:
        logger.info("No rows in CSV")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.set_default_timeout(15000)

        for row in rows:
            team_name = row["team_name"]
            website_url = row["website"]
            result, status = process_row(team_name, website_url, page)
            db.log_run(team_name, website_url, status, result.get("Form Page URL", ""))
            write_row_to_sheet(worksheet, col_map, existing_rows, team_name, result)
            delay = random.uniform(3, 5)
            logger.info("Done. Status=%s. Waiting %.1fs", status, delay)
            time.sleep(delay)

        browser.close()

    logger.info("Team Outreach Agent finished")


if __name__ == "__main__":
    main()
