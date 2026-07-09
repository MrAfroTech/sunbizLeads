# LifeHacking – Personal Life Management (Trello)

Trello board automation for a Jira-style personal life management system: one board, 8 categories (lists), labels, and placeholder cards.

## 8 Categories (Lists)

1. **Finances & Credit** – Bills, credit repair, budgeting, investments  
2. **Legal & Compliance** – Probation, legal obligations, court dates, documentation  
3. **Personal Development** – Reading, courses, AI/fintech learning, journaling, mindset  
4. **Business & Career** – Startup tasks, networking, side income, trading  
5. **Family & Relationships** – Children, dating, family, social connections  
6. **Health & Lifestyle** – Physical/mental health, diet, exercise, rest  
7. **Logistics & Daily Operations** – Transportation, household, camper, errands  
8. **Spiritual Life** – Aligning inner life with values, purpose, emotional resilience  
   - *Examples:* Daily meditation/prayer/reflection; journaling (gratitude, goals, lessons); spiritual/philosophical reading; acts of service or community contribution  

## Setup

1. **Get Trello credentials**  
   - [Trello Power-Up Admin](https://trello.com/power-ups/admin) → Generate API Key  
   - Use the Token link to generate and allow a token  

2. **Configure environment**  
   ```bash
   cp .env.example .env
   # Edit .env: set TRELLO_API_KEY and TRELLO_API_TOKEN
   ```

3. **Install dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

4. **Create the board (once)**  
   ```bash
   python setup_board.py
   ```  
   This creates the private board "Personal Life Management", 8 lists, default labels (High/Medium/Low Priority, Recurring, Financial, Personal Development), and one placeholder card per list.  
   Copy the printed `TRELLO_BOARD_ID` into your `.env`.

## Using the API (add cards, move, complete)

Use `trello_client` in your own scripts:

```python
from trello_client import get_lists, get_cards, create_card, move_card, set_card_complete, get_board_id

board_id = get_board_id()
lists = get_lists()           # list of list dicts (id, name)
cards = get_cards()           # all cards on board
# Create a card in the first list
list_id = lists[0]["id"]
card = create_card(list_id, "My new task", desc="Optional description")
# Move and complete
move_card(card["id"], lists[1]["id"])
set_card_complete(card["id"], True)
```

## Security

- Never commit `.env` (it’s in `.gitignore`).  
- Use `.env.example` only to document required variables (no real keys/tokens).
