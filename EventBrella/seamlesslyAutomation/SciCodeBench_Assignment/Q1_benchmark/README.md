# Q1: SciCode-Bench Style Benchmark (Run Without Google Colab)

This folder contains a scientific coding benchmark with **three subtasks**, a **golden solution**, and **unit tests**. Everything runs locally; no Colab or Gemini API required.

## Contents

| File | Purpose |
|------|--------|
| `BENCHMARK_PROMPT.md` | Benchmark prompt: problem descriptions and required outputs for all three subtasks |
| `golden_solution.py` | Reference implementation (golden solution) for the three subtasks |
| `test_benchmark.py` | Unit tests for each subtask (existence, correctness, boundary/sanity; deterministic) |
| `run_tests.py` | Run tests with Python stdlib only: `python run_tests.py` |
| `requirements.txt` | Optional: `scipy`, `pytest` (scipy improves Wilson CI; pytest allows `pytest test_benchmark.py -v`) |

## How to Run the Benchmark (No Colab)

### 1. Implement the benchmark (or use the golden solution)

- Read **`BENCHMARK_PROMPT.md`** for the three subtasks and exact output contracts.
- Implement in Python:
  - **Subtask 1:** `subtask1_logistic(r, K, N0, t) -> float | None`
  - **Subtask 2:** `subtask2_wilson_ci(n, s, alpha) -> tuple[float, float]`
  - **Subtask 3:** `subtask3_spectral_radius(a, b, c, d) -> float`
- If you want to **run the golden solution as the “model”**, use `golden_solution.py` (same interface).

### 2. Run unit tests

**Option A – Stdlib only (no pip install):**

```bash
cd Q1_benchmark
python run_tests.py
```

**Option B – With pytest (if installed):**

```bash
cd Q1_benchmark
pip install -r requirements.txt   # optional: scipy, pytest
pytest test_benchmark.py -v
```

### 3. Verify your implementation

- Point the tests at **your** implementation by changing the import in `test_benchmark.py` from `golden_solution` to your module (e.g. `from my_solution import ...`).
- All 30 tests must pass (existence, correctness, boundary/sanity, determinism).

## Test Coverage

- **Subtask 1:** Output existence (float/None), correctness (t=0, t=1, 6 decimals), boundary (stable/unstable, t=0).
- **Subtask 2:** Output existence (tuple of 2 floats), correctness (lower < upper, in [0,1], 6 decimals), boundary (s=0, s=n, n=1).
- **Subtask 3:** Output existence (float, non-negative), correctness (identity, rotation, diagonal, 6 decimals), boundary (zero matrix, real/complex eigenvalues).

## Dataset

No external dataset is required. Inputs are specified in the benchmark prompt and in the test cases. For custom inputs, use the function signatures in `BENCHMARK_PROMPT.md`.

## Using with an LLM (e.g. Gemini) without Colab

1. Paste the **benchmark prompt** (from `BENCHMARK_PROMPT.md`) into your LLM.
2. Collect the model’s code (e.g. Python) and save it as a module (e.g. `candidate_solution.py`) with the same function names and signatures.
3. In `test_benchmark.py`, replace `from golden_solution import ...` with `from candidate_solution import ...`.
4. Run `python run_tests.py` (or `pytest test_benchmark.py -v`) and record pass/fail for each test.

This gives you a **machine-verifiable** benchmark run without Colab.
