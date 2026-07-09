"""
Create the Personal Life Management Trello board with 8 lists, default labels,
and one placeholder card per list. Run once; then set TRELLO_BOARD_ID in .env.
"""
import os
import time
from dotenv import load_dotenv
from trello_client import post, get, _auth

load_dotenv()

BOARD_NAME = "Personal Life Management"

# 8 lists in order (including Spiritual Life)
LISTS = [
    ("Finances & Credit", "Track bills, credit repair, budgeting, and investments."),
    ("Legal & Compliance", "Probation, legal obligations, court dates, documentation."),
    ("Personal Development", "Reading, courses, AI/fintech learning, journaling, mindset growth."),
    ("Business & Career", "Startup tasks, networking, side income, trading."),
    ("Family & Relationships", "Children, dating, family responsibilities, social connections."),
    ("Health & Lifestyle", "Physical and mental health, diet, exercise, rest, moderation."),
    ("Logistics & Daily Operations", "Transportation, household tasks, camper maintenance, errands."),
    ("Spiritual Life", "Aligning inner life with values, purpose, and emotional resilience. "
     "E.g. daily meditation/prayer/reflection, journaling (gratitude, goals, lessons), "
     "reading spiritual/philosophical texts, acts of service or community contribution."),
]

# name -> Trello color
LABELS = [
    ("High Priority", "red"),
    ("Medium Priority", "yellow"),
    ("Low Priority", "green"),
    ("Recurring", "blue"),
    ("Financial", "purple"),
    ("Personal Development", "orange"),
]

PLACEHOLDER_TITLE = "Placeholder – tasks to be added later"
PLACEHOLDER_DESC = (
    "Tasks will be added later. Use labels to categorize priority and type.\n\n"
    "Checklist idea: Add tasks here as they arise."
)


def main():
    try:
        _auth()
    except ValueError as e:
        print(e)
        print("Copy .env.example to .env and set TRELLO_API_KEY and TRELLO_API_TOKEN.")
        return 1

    print(f"Creating board: {BOARD_NAME} (private)...")
    board = post("/boards", params={
        "name": BOARD_NAME,
        "defaultLists": "false",
        "prefs/visibility": "private",
    })
    board_id = board["id"]
    print(f"  Board ID: {board_id}")
    print(f"  URL: {board.get('url', 'https://trello.com/b/' + board.get('shortLink', board_id))}")
    time.sleep(0.5)

    list_ids = []
    for name, purpose in LISTS:
        lst = post(f"/boards/{board_id}/lists", params={"name": name})
        list_ids.append((lst["id"], name))
        print(f"  List: {name}")
        time.sleep(0.3)

    print("Creating labels...")
    for name, color in LABELS:
        post(f"/boards/{board_id}/labels", params={"name": name, "color": color})
        time.sleep(0.2)

    print("Creating placeholder card in each list...")
    for list_id, list_name in list_ids:
        post("/cards", params={
            "idList": list_id,
            "name": PLACEHOLDER_TITLE,
            "desc": PLACEHOLDER_DESC,
        })
        time.sleep(0.3)

    print("\nDone. Add to your .env:")
    print(f"  TRELLO_BOARD_ID={board_id}")
    return 0


if __name__ == "__main__":
    exit(main())
