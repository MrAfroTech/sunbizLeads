# Digital Ticketing Auto-Build Script

Automates filling the white-label form with event data and saving the generated Cursor prompt to a text file.

## What It Does

1. Opens `white-label-form.html` in a headless browser (Chromium).
2. Fills all form fields from `event-data.json` (identity, venue, contact, ticketing tiers, points of contact).
3. Clicks **Submit form → Generate prompt**.
4. Reads the generated prompt from the preview area.
5. Saves it to a `.txt` file (e.g. `itll-happen-boyz-showcase-cursor-prompt.txt`).

## Requirements

- **Python 3.8+**
- **Playwright** (browser automation)

## Setup

```bash
# From the whiteLabelDigitalTicketingSystem directory
pip install playwright
playwright install chromium
```

## Run

```bash
# Default: uses event-data.json, local white-label-form.html, saves to filename in JSON
python digitalTicketingAutoBuild.py

# Custom paths
python digitalTicketingAutoBuild.py --data path/to/event-data.json --form path/to/white-label-form.html --output my-prompt.txt

# Show the browser window while it runs (useful for debugging)
python digitalTicketingAutoBuild.py --headed
```

## Arguments

| Argument   | Default                    | Description |
|-----------|----------------------------|-------------|
| `--data`  | `event-data.json`          | Path to JSON file with event data. |
| `--form`  | `white-label-form.html`    | Path to the white-label form HTML file. |
| `--output`| From JSON or `itll-happen-boyz-showcase-cursor-prompt.txt` | Path for the generated prompt file. |
| `--headed`| (flag)                     | Run browser visible instead of headless. |

## Event Data Format

`event-data.json` should contain:

- **identity**: `CLIENT_NAME`, `CLIENT_ORGANIZER_NAME`, `CLIENT_EVENT_NAME`, `CLIENT_EVENT_DATE`, `CLIENT_EVENT_START_TIME`, `CLIENT_EVENT_END_TIME`, `CLIENT_EVENT_DESCRIPTION`
- **venue**: `CLIENT_VENUE_NAME`, `CLIENT_ADDRESS_LINE1`, `CLIENT_ADDRESS_LINE2`, `CLIENT_PHONE`
- **contact**: `CLIENT_WEBSITE_URL`, `CLIENT_CONTACT_EMAIL`, **contacts** (array of `{ name, email, phone, role }`)
- **tiers**: array of `{ name, id, price, capacity, description }`
- **output_prompt_filename** (optional): default output filename

See `event-data.json` in this directory for the It'll Happen Boyz Summer Showcase example.

## Success Criteria

- Script runs without errors: `python digitalTicketingAutoBuild.py`
- Form fields are populated (run with `--headed` to verify).
- File `itll-happen-boyz-showcase-cursor-prompt.txt` (or your `--output`) is created with the full Cursor instruction.
- That file can be copied into Cursor to generate the client ticketing site.

## Troubleshooting

- **"Playwright not installed"** → Run `pip install playwright` and `playwright install chromium`.
- **"Form not found"** → Ensure `--form` points to `white-label-form.html` (same folder as the script by default).
- **Preview empty or wrong** → Form may need a moment after submit; increase the wait after `#btnSubmitForm` in the script if needed.
- **Time dropdown not selecting** → Ensure `CLIENT_EVENT_START_TIME` and `CLIENT_EVENT_END_TIME` in JSON match the form’s option values (e.g. `"8:00 AM"`, `"6:00 PM"`).
