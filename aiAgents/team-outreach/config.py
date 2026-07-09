"""
Config loaded from .env. Used by agent.py for sender info and message template.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(SCRIPT_DIR / ".env")

SENDER_NAME = os.environ.get("SENDER_NAME", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "")
SENDER_PHONE = os.environ.get("SENDER_PHONE", "")
MESSAGE_TEMPLATE = os.environ.get(
    "MESSAGE_TEMPLATE",
    """Hi [FIRST_CONTACT],

77% of MLB fans spend more with short lines. 45% skip long ones—costing merch & ticket sales. We partnered with the Orlando Pirates for a better fan experience & margins. 👉🏾 orlandopirates.seamlessly.us

We can do the same for the [TEAM_NAME]. Who's the best person to connect with?""",
)
