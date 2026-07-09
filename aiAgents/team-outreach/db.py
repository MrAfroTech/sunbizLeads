"""
Database logging for team outreach runs.
"""
import sqlite3
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DB_PATH = SCRIPT_DIR / "outreach.db"

# Status values for outreach_runs.status
STATUS_PENDING = "pending"
STATUS_SUBMITTED = "submitted"
STATUS_CAPTCHA_PAUSED = "captcha_paused"
STATUS_ERROR = "error"
STATUS_NO_CONTACT_PAGE = "no_contact_page"
STATUS_NO_FORM_FOUND = "no_form_found"


def init_db():
    """Create SQLite tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS outreach_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT,
            website_url TEXT,
            status TEXT,
            form_page_url TEXT,
            timestamp TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def log_run(team_name: str, website_url: str, status: str, form_page_url: str = ""):
    """Append one run to local SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO outreach_runs (team_name, website_url, status, form_page_url, timestamp)
        VALUES (?, ?, ?, ?, ?)""",
        (team_name, website_url, status, form_page_url or "", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
    )
    conn.commit()
    conn.close()
