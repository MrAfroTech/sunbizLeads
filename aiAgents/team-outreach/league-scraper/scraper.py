#!/usr/bin/env python3
"""
League Team Scraper for Baseball Independent Leagues

Scrapes official Teams/Clubs pages and collects Team Name and Website URL per team,
then writes/upserts rows in a Google Sheet. Exactly two columns: Team Name, Website URL.
Rows are deduplicated by (Team Name, Website URL).
"""
import logging
import os
import random
import re
import sqlite3
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from playwright.sync_api import sync_playwright

# Paths & env
BASE_DIR = Path(__file__).resolve().parent
PARENT_DIR = BASE_DIR.parent
load_dotenv(PARENT_DIR / ".env")

LOG_FILE = BASE_DIR / "scraper.log"
DB_PATH = BASE_DIR / "scraper.db"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


@dataclass
class LeagueConfig:
    name: str
    domain: str
    base_url: str
    teams_path: Optional[str] = None  # if known, e.g. "/teams" or "/clubs/"


LEAGUES: List[LeagueConfig] = [
    LeagueConfig("Atlantic League", "atlanticleague.com", "https://www.atlanticleague.com", "/clubs/"),
    LeagueConfig("Frontier League", "frontierleague.com", "https://www.frontierleague.com", "/teams"),
    LeagueConfig("American Association", "aabaseball.com", "https://www.aabaseball.com", "/teams"),
    LeagueConfig("Pioneer League", "pioneerleague.com", "https://www.pioneerleague.com", "/sports/bsb/2025/teams"),
    LeagueConfig("Pecos League", "pecosleague.com", "https://www.pecosleague.com"),
    LeagueConfig("Empire League", "empireproleague.com", "https://empireproleague.com", "/teams"),
    LeagueConfig("MLB Draft League", "mlbdraftleague.com", "https://www.mlbdraftleague.com"),
    LeagueConfig("Pacific Association", "pacificassociation.com", "https://pacificassociation.com"),
]


def get_sheets_client() -> Tuple[gspread.Client, str]:
    """Return an authenticated Sheets client and TEAMS_SHEET_ID.

    Idempotent behavior:
    - If TEAMS_SHEET_ID is already set (env/.env), reuse it.
    - If missing, create a new 'League Teams' sheet, persist its ID to
      team-outreach/.env, and continue using that ID.
    """
    # Build authenticated client first using shared service account.
    # When searching for the credentials JSON, start from one directory
    # above this script (PARENT_DIR) and look within that subtree.
    creds_path_env = os.environ.get("GOOGLE_CREDENTIALS_PATH")

    if creds_path_env:
        cp = Path(creds_path_env)
        if not cp.is_absolute():
            creds_path = PARENT_DIR / cp
        else:
            creds_path = cp
    else:
        # Search from PARENT_DIR (../ relative to this script) for a
        # likely service account JSON file, preferring the conventional
        # google-sheets-service-account.json name.
        creds_path = None
        preferred_name = "google-sheets-service-account.json"
        for root, _dirs, files in os.walk(PARENT_DIR):
            if preferred_name in files:
                creds_path = Path(root) / preferred_name
                break
        if creds_path is None:
            raise FileNotFoundError(
                f"Google Sheets credentials not found under {PARENT_DIR}. "
                "Set GOOGLE_CREDENTIALS_PATH in team-outreach/.env or add "
                f"a {preferred_name} file under that directory."
            )

    creds_path = Path(creds_path)
    if not creds_path.exists():
        raise FileNotFoundError(
            f"Google credentials not found at {creds_path}. "
            "Copy your service account JSON there or update GOOGLE_CREDENTIALS_PATH."
        )

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(creds_path), scopes=scopes)
    client = gspread.authorize(creds)

    sheet_id = os.environ.get("TEAMS_SHEET_ID")
    if not sheet_id:
        logger.info("TEAMS_SHEET_ID not set; creating new 'League Teams' spreadsheet.")
        new_sheet = client.create("League Teams")
        sheet_id = getattr(new_sheet, "id", None) or getattr(new_sheet, "spreadsheet_id", None)
        if not sheet_id:
            raise RuntimeError(
                "Failed to obtain ID for newly created 'League Teams' spreadsheet."
            )

        env_path = PARENT_DIR / ".env"
        try:
            lines: List[str] = []
            if env_path.exists():
                with env_path.open("r", encoding="utf-8") as f:
                    lines = f.readlines()

            key_prefix = "TEAMS_SHEET_ID="
            new_line = f"{key_prefix}{sheet_id}\n"
            replaced = False
            updated_lines: List[str] = []

            for line in lines:
                if line.startswith(key_prefix):
                    updated_lines.append(new_line)
                    replaced = True
                else:
                    updated_lines.append(line)

            if not replaced:
                updated_lines.append(new_line)

            with env_path.open("w", encoding="utf-8") as f:
                f.writelines(updated_lines)

            os.environ["TEAMS_SHEET_ID"] = sheet_id
            logger.info(
                "Created new 'League Teams' sheet with ID %s and saved TEAMS_SHEET_ID to %s",
                sheet_id,
                env_path,
            )
        except Exception as e:
            logger.error("Failed to persist TEAMS_SHEET_ID to %s: %s", env_path, e)
            # Continue using in-memory sheet_id even if persisting fails

    return client, sheet_id


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS team_scrapes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT,
            website_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def log_scrape_to_db(team_name: str, website_url: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO team_scrapes (team_name, website_url)
        VALUES (?, ?)""",
        (team_name, website_url),
    )
    conn.commit()
    conn.close()


def resolve_url(href: str, base: str) -> Optional[str]:
    href = (href or "").strip()
    if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
        return None
    if href.startswith("http://") or href.startswith("https://"):
        return href
    base = base.rstrip("/")
    if href.startswith("/"):
        # absolute path on same domain
        return base.split("//", 1)[0] + "//" + base.split("//", 1)[1].split("/", 1)[0] + href
    return f"{base}/{href.lstrip('/')}"


def get_domain(url: str) -> str:
    m = re.match(r"https?://([^/]+)", url)
    return m.group(1) if m else ""


def is_social_domain(domain: str) -> bool:
    social = [
        "facebook.com",
        "instagram.com",
        "twitter.com",
        "x.com",
        "tiktok.com",
        "youtube.com",
        "youtu.be",
        "linkedin.com",
    ]
    return any(domain.endswith(d) for d in social)


def filter_team_link_text(text: str) -> bool:
    t = text.strip()
    if len(t) < 3:
        return False
    bad_words = [
        "schedule",
        "tickets",
        "shop",
        "store",
        "stats",
        "standings",
        "news",
        "roster",
        "login",
        "register",
        "watch",
        "video",
        "broadcast",
    ]
    lower = t.lower()
    return not any(w in lower for w in bad_words)


def find_teams_page(page, league: LeagueConfig) -> Optional[str]:
    # 1) Try explicit teams_path if provided
    if league.teams_path:
        url = league.base_url.rstrip("/") + league.teams_path
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_load_state("networkidle", timeout=10000)
            return page.url
        except Exception as e:
            logger.warning("Failed to load explicit teams path %s for %s: %s", url, league.name, e)

    # 2) Fallback: open home and search nav/footer links
    try:
        page.goto(league.base_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception as e:
        logger.error("Failed to load league home %s: %s", league.base_url, e)
        return None

    candidates = []
    try:
        links = page.query_selector_all("a[href]")
        for a in links:
            try:
                text = (a.inner_text() or "").strip().lower()
                href = a.get_attribute("href") or ""
                if not text:
                    continue
                if any(k in text for k in ["teams", "clubs", "member clubs", "league map"]):
                    full = resolve_url(href, league.base_url)
                    if full:
                        candidates.append(full)
            except Exception:
                continue
    except Exception:
        pass

    for url in candidates:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_load_state("networkidle", timeout=10000)
            return page.url
        except Exception:
            continue

    return None


def extract_team_entries_from_page(page, league: LeagueConfig) -> List[Tuple[str, Optional[str]]]:
    """Return list of (team_name, team_page_url_or_external_url).

    Heuristic: any reasonable anchor text on the teams page that passes
    filter_team_link_text is treated as a team name. We keep the first URL
    associated with that anchor.
    """
    anchors = page.query_selector_all("a[href]")
    league_domain = league.domain
    teams: Dict[str, str] = {}

    for a in anchors:
        try:
            text = (a.inner_text() or "").strip()
            if not filter_team_link_text(text):
                continue
            href = a.get_attribute("href") or ""
            full = resolve_url(href, page.url)
            if not full:
                continue
            domain = get_domain(full)
            # Prefer non-social links; keep first seen per team name
            if is_social_domain(domain):
                continue
            if text not in teams:
                teams[text] = full
        except Exception:
            continue

    entries: List[Tuple[str, Optional[str]]] = []
    for name, url in teams.items():
        entries.append((name, url))
    return entries


def discover_official_url_from_team_page(page, league: LeagueConfig, team_page_url: str) -> str:
    """From a league-hosted team page, try to find the team's external official site.
    Falls back to the team_page_url if nothing better is found.
    """
    try:
        page.goto(team_page_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception as e:
        logger.warning("Failed to open team page %s: %s", team_page_url, e)
        return team_page_url

    league_domain = league.domain
    anchors = page.query_selector_all("a[href]")
    for a in anchors:
        try:
            href = a.get_attribute("href") or ""
            full = resolve_url(href, page.url)
            if not full:
                continue
            domain = get_domain(full)
            if domain and domain != league_domain and not is_social_domain(domain):
                return full
        except Exception:
            continue

    return team_page_url


def ensure_sheet_headers(ws) -> Dict[str, int]:
    """Ensure exactly two columns: Team Name, Website URL."""
    required = ["Team Name", "Website URL"]
    headers = ws.row_values(1)
    if headers != required:
        ws.update("A1:B1", [required])
        time.sleep(0.5)
    return {"Team Name": 1, "Website URL": 2}


def load_existing_rows(ws) -> Dict[Tuple[str, str], int]:
    """Return mapping (team_name, website_url) -> row_index for deduplication."""
    records = ws.get_all_records()
    mapping: Dict[Tuple[str, str], int] = {}
    for idx, row in enumerate(records, start=2):
        team_name = str(row.get("Team Name", "")).strip()
        website_url = str(row.get("Website URL", "")).strip()
        if team_name or website_url:
            mapping[(team_name, website_url)] = idx
    return mapping


def upsert_team_row(
    ws,
    col_map: Dict[str, int],
    existing: Dict[Tuple[str, str], int],
    team_name: str,
    website_url: str,
) -> None:
    """Deduplicate by (team_name, website_url): update if exists, else append."""
    key = (team_name.strip(), website_url.strip())
    if key in existing:
        # Row already present; no need to update URL/name
        return
    ws.append_row([team_name, website_url])
    existing[key] = len(existing) + 2
    time.sleep(0.5)


def scrape_league(page, ws, col_map, existing_map, league: LeagueConfig) -> None:
    logger.info("Scraping league: %s", league.name)
    try:
        teams_page_url = find_teams_page(page, league)
    except Exception as e:
        logger.error("Error locating teams page for %s: %s", league.name, e)
        return

    if not teams_page_url:
        logger.error("No teams page found for %s", league.name)
        return

    logger.info("%s teams page: %s", league.name, teams_page_url)

    try:
        page.goto(teams_page_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception as e:
        logger.error("Failed to load teams page for %s: %s", league.name, e)
        return

    entries = extract_team_entries_from_page(page, league)
    logger.info("Found %d potential team entries for %s", len(entries), league.name)

    for idx, (team_name, team_url) in enumerate(entries, start=1):
        team_name = team_name.strip()
        if not team_name:
            continue

        # Determine official URL (team homepage)
        official_url = team_url or ""
        league_domain = league.domain
        if official_url and get_domain(official_url) == league_domain:
            delay = random.uniform(2, 3)
            logger.info("Visiting team page for %s (%s) in %.1fs", team_name, league.name, delay)
            time.sleep(delay)
            official_url = discover_official_url_from_team_page(page, league, official_url)

        if not official_url:
            logger.warning("No official URL found for %s (%s)", team_name, league.name)
            continue

        logger.info("Team: %s | URL: %s", team_name, official_url)

        try:
            upsert_team_row(ws, col_map, existing_map, team_name, official_url)
            log_scrape_to_db(team_name, official_url)
        except Exception as e:
            logger.error("Failed to write team %s to sheet/DB: %s", team_name, e)

        time.sleep(random.uniform(2, 3))


def main() -> None:
    logger.info("League Team Scraper starting")
    init_db()

    client, sheet_id = get_sheets_client()
    sheet = client.open_by_key(sheet_id).sheet1
    col_map = ensure_sheet_headers(sheet)
    existing_map = load_existing_rows(sheet)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.set_default_timeout(15000)

        for league in LEAGUES:
            try:
                scrape_league(page, sheet, col_map, existing_map, league)
            except Exception as e:
                logger.error("League scrape failed for %s: %s", league.name, e)

        browser.close()

    logger.info("League Team Scraper finished")


if __name__ == "__main__":
    main()
