# SciCode-Bench Style + Interactive Q2 (No Google Colab)

This folder contains solutions for **both** assignment questions, designed to run **without Google Colab**.

---

## Question 1: SciCode-Bench Style Scientific Reasoning Task

**Location:** `Q1_benchmark/`

- **Benchmark prompt** with **three subtasks** (logistic growth, Wilson CI, spectral radius).
- **Golden solution** in Python (`golden_solution.py`).
- **Unit tests** for each subtask (existence, correctness, boundary/sanity; deterministic).
- **Run locally:** `python run_tests.py` (stdlib) or `pytest test_benchmark.py -v` (with pytest).

**Deliverables:**
- Colab for benchmark → use **`BENCHMARK_PROMPT.md`** + **`test_benchmark.py`** (run in any Python env; no Colab required).
- Golden solution → **`golden_solution.py`** (unit tests in **`test_benchmark.py`**).
- Dataset → none; inputs are in the prompt and tests.
- Instructions → **`Q1_benchmark/README.md`**.

---

## Question 2: Interactive Question and Rubrics

**Location:** `Q2_interactive/`

- **Interactive question** (prompt) that benefits from back-and-forth (API design with clarification and confirmation).
- **System Instructions (SI)** so Gemini responds step-by-step and asks questions before implementing.
- **CUJ rubric** in JSON with 10 criteria and `human_rating` fields; designed so **≥30% of criteria are false** when applied to a typical Gemini answer (headroom).
- **Submission template:** CSV (Prompt, DI, Gemini Response, Json_rubrics, HTML URL) and HTML file for saving the conversation.

**Deliverables:**
- Complete the task in the **Gemini app** (no Colab).
- Fill **`submission_template.csv`** and **`submission_template.html`**; upload HTML to Drive and put URL in the CSV.
- Use **`cuj_rubric.json`** (and **`cuj_rubric_filled_example.json`** as reference) when scoring.

---

## Quick start

| Goal | Action |
|------|--------|
| Run Q1 benchmark + tests | `cd Q1_benchmark && python run_tests.py` |
| Read Q1 instructions | Open `Q1_benchmark/README.md` |
| Do Q2 interactive task | Open `Q2_interactive/PROMPT_AND_SI.md`, use Gemini app, then fill CSV and HTML |
| Score Q2 with rubric | Use `Q2_interactive/cuj_rubric.json` and set `human_rating` per criterion |
