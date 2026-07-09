"""
Trello API client for Life Management board.
Uses TRELLO_API_KEY and TRELLO_API_TOKEN from environment.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE = "https://api.trello.com/1"


def _auth():
    key = os.environ.get("TRELLO_API_KEY")
    token = os.environ.get("TRELLO_API_TOKEN")
    if not key or not token:
        raise ValueError("Set TRELLO_API_KEY and TRELLO_API_TOKEN in .env")
    return {"key": key, "token": token}


def _url(path, params=None):
    p = dict(_auth())
    if params:
        p.update(params)
    return f"{BASE}{path}", p


def get(path, params=None):
    url, p = _url(path, params)
    r = requests.get(url, params=p, timeout=30)
    r.raise_for_status()
    return r.json()


def post(path, params=None, json=None):
    url, p = _url(path, params)
    r = requests.post(url, params=p, json=json, timeout=30)
    r.raise_for_status()
    return r.json() if r.content else None


def put(path, params=None, json=None):
    url, p = _url(path, params)
    r = requests.put(url, params=p, json=json, timeout=30)
    r.raise_for_status()
    return r.json() if r.content else None


def get_board_id():
    bid = os.environ.get("TRELLO_BOARD_ID")
    if not bid:
        raise ValueError("Set TRELLO_BOARD_ID in .env (run setup_board.py first)")
    return bid


def get_lists(board_id=None):
    board_id = board_id or get_board_id()
    return get(f"/boards/{board_id}/lists")


def get_cards(board_id=None, list_id=None):
    board_id = board_id or get_board_id()
    if list_id:
        return get(f"/lists/{list_id}/cards")
    return get(f"/boards/{board_id}/cards")


def create_card(id_list, name, desc=None, id_labels=None):
    params = {"idList": id_list, "name": name}
    if desc:
        params["desc"] = desc
    if id_labels:
        params["idLabels"] = ",".join(id_labels) if isinstance(id_labels, (list, tuple)) else id_labels
    return post("/cards", params=params)


def update_card(card_id, **kwargs):
    params = {k: v for k, v in kwargs.items() if v is not None}
    return put(f"/cards/{card_id}", params=params)


def move_card(card_id, id_list):
    return put(f"/cards/{card_id}", params={"idList": id_list})


def set_card_complete(card_id, complete=True):
    return put(f"/cards/{card_id}", params={"dueComplete": str(complete).lower()})
