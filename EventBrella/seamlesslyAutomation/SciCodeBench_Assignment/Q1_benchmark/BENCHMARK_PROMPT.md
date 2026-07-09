# SciCode-Bench Style: Benchmark Prompt (Three Subtasks)

**Run this benchmark locally (no Colab required).** Implement each subtask so that your solution produces the exact output format specified; then run the provided unit tests to verify.

---

## Subtask 1: Numerical Stability in Logistic Growth

**Description:**  
Compute the population at time `t` under the discrete logistic map:
`N(t+1) = r * N(t) * (1 - N(t)/K)` with `N(0) = N0`, for given `r`, `K`, `N0`, and integer `t >= 0`. Use **float64** and iterate step-by-step (no closed-form approximation). Handle numerical edge cases: if `N(t)` becomes `<= 0` or `>= 2*K` at any step, return `None` and treat as numerically unstable.

**Input (you will receive):**
- `r` (float, 0 < r <= 4)
- `K` (float, K > 0)
- `N0` (float, 0 < N0 < K)
- `t` (int, t >= 0)

**Required output (machine-verifiable):**
- A single float: `N(t)` after `t` iterations, rounded to **6 decimal places**, or `None` if unstable.
- Function signature: `subtask1_logistic(r: float, K: float, N0: float, t: int) -> float | None`

**Example (for sanity check):**  
`r=2.5, K=100.0, N0=10.0, t=5` → your function must return a float (e.g. one possible value near 88.1…); `t=0` → return `10.0`.

---

## Subtask 2: Empirical Confidence Interval for a Proportion

**Description:**  
Given `n` Bernoulli trials and `s` successes, compute the **Wilson score interval** for the proportion `p = s/n` at confidence level `alpha` (e.g. 0.95 for 95%). Use the exact formula:
- `z = norm.ppf(1 - (1-alpha)/2)` (e.g. scipy.stats.norm)
- Center: `(s + z²/2) / (n + z²)`
- Margin (half-width): `(z / (n + z²)) * sqrt(s*(n-s)/n + z²/4)`
- Return `(lower, upper)` with both bounds in [0, 1], rounded to **6 decimal places**.

**Input:**
- `n` (int, n >= 1)
- `s` (int, 0 <= s <= n)
- `alpha` (float, 0 < alpha < 1, e.g. 0.95)

**Required output:**
- `(lower, upper)` as a tuple of two floats, each rounded to 6 decimal places.
- Function signature: `subtask2_wilson_ci(n: int, s: int, alpha: float) -> tuple[float, float]`

**Edge cases:**  
`n=s=1` → interval is not [0,1] but a valid Wilson interval (narrow). `s=0` or `s=n` must still return a valid (lower, upper) within [0, 1].

---

## Subtask 3: Small Matrix Eigenvalue with Spectral Radius

**Description:**  
Given a 2×2 real matrix `A = [[a, b], [c, d]]`, compute the **spectral radius** (largest absolute eigenvalue). If eigenvalues are complex, use their modulus. Return the spectral radius as a non-negative float rounded to **6 decimal places**. You may use a closed form for 2×2: trace = a+d, det = a*d - b*c; eigenvalues are (trace ± sqrt(trace² - 4*det))/2; spectral radius = max(|λ1|, |λ2|).

**Input:**
- `a, b, c, d` (four floats)

**Required output:**
- One float: spectral radius >= 0, rounded to 6 decimal places.
- Function signature: `subtask3_spectral_radius(a: float, b: float, c: float, d: float) -> float`

**Edge cases:**  
Matrix [[1,0],[0,1]] → 1.0. Matrix [[0,1],[-1,0]] → 1.0 (complex eigenvalues ±i, modulus 1).

---

## Output Contract (for all subtasks)

- All floats must be rounded to **6 decimal places** unless the spec says otherwise.
- Return types: Subtask 1 → `float | None`; Subtask 2 → `tuple[float, float]`; Subtask 3 → `float`.
- Your implementation will be checked by the provided unit tests (existence, correctness, boundaries). Run the test file to verify before submission.
