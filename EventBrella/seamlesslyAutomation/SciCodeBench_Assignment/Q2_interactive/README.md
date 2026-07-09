# Q2: Interactive Question and Rubrics (No Colab)

Complete this task in the **Gemini app** (or any chat UI with Gemini). No Google Colab required.

## Contents

| File | Purpose |
|------|--------|
| `PROMPT_AND_SI.md` | Full **prompt** (interactive question) and **System Instructions (SI)** to paste into Gemini |
| `cuj_rubric.json` | **CUJ rubric** in JSON: 10 criteria with success/failure conditions and `human_rating` fields (fill when scoring) |
| `cuj_rubric_filled_example.json` | Example filled rubric with **≥30% human_rating false** (50% in the example) to show headroom |
| `submission_template.csv` | Spreadsheet template: columns Prompt, DI, Gemini Response, Json_rubrics, Saved HTML file (URL) |
| `submission_template.html` | HTML template: paste your conversation here, save, upload to Drive, and put the URL in the CSV |

## Steps (without Colab)

1. **Set System Instructions** in the Gemini app using the SI in `PROMPT_AND_SI.md`.
2. **Send the Prompt** from `PROMPT_AND_SI.md` to start the conversation.
3. **Interact:** Answer the model’s questions, confirm the API, then ask for the implementation sketch.
4. **Score the response** using `cuj_rubric.json`: set `human_rating` to `true` or `false` for each criterion. The rubric is designed so that a typical Gemini answer gets **at least 30% false** (headroom).
5. **Fill the spreadsheet** (`submission_template.csv`): Prompt, DI (system instructions), Gemini Response (or summary), the filled `Json_rubrics`, and the URL of the saved HTML file.
6. **Save the conversation** in `submission_template.html` (paste each turn), upload to Google Drive, and add the shareable link to the CSV.

## Rubric headroom

The rubric has 10 criteria. When you score the Gemini response, at least **3 criteria (30%)** should have `human_rating: false` (e.g. no clarifying question in first turn, no edge case mentioned, no invitation to follow-up). See `cuj_rubric_filled_example.json` for an example with 50% false.
