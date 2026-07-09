"""
Golden / reference solution for the SciCode-style benchmark (three subtasks).
Run locally; no Colab required. Use with unit tests in test_benchmark.py.
"""

from __future__ import annotations

import math
from typing import Optional


# ---------- Subtask 1: Numerical stability in logistic growth ----------

def subtask1_logistic(r: float, K: float, N0: float, t: int) -> Optional[float]:
    """
    Discrete logistic map: N(t+1) = r * N(t) * (1 - N(t)/K).
    Returns N(t) rounded to 6 decimals, or None if numerically unstable.
    """
    if t < 0:
        raise ValueError("t must be >= 0")
    if not (0 < r <= 4 and K > 0 and 0 < N0 < K):
        raise ValueError("Invalid bounds for r, K, N0")
    n = float(N0)
    for _ in range(t):
        n = r * n * (1.0 - n / K)
        if n <= 0 or n >= 2.0 * K:
            return None
    return round(n, 6)


# ---------- Subtask 2: Wilson score interval for proportion ----------

def _norm_ppf(p: float) -> float:
    """Inverse CDF of standard normal. Uses scipy if available else approx for 0.975."""
    try:
        from scipy.stats import norm
        return float(norm.ppf(p))
    except ImportError:
        if abs(p - 0.975) < 0.01:
            return 1.959963984540054  # approx for 0.95 CI
        if abs(p - 0.995) < 0.01:
            return 2.5758293035489004
        raise NotImplementedError("Install scipy for arbitrary alpha")


def subtask2_wilson_ci(n: int, s: int, alpha: float) -> tuple[float, float]:
    """
    Wilson score interval for binomial proportion.
    Returns (lower, upper) each rounded to 6 decimal places.
    """
    if not (n >= 1 and 0 <= s <= n and 0 < alpha < 1):
        raise ValueError("Invalid n, s, or alpha")
    z = _norm_ppf(1.0 - (1.0 - alpha) / 2.0)
    z2 = z * z
    center = (s + z2 / 2.0) / (n + z2)
    denom = n + z2
    radicand = s * (n - s) / n + z2 / 4.0
    if radicand < 0:
        radicand = 0.0
    margin = (z / denom) * math.sqrt(radicand)
    lower = max(0.0, min(1.0, center - margin))
    upper = max(0.0, min(1.0, center + margin))
    return (round(lower, 6), round(upper, 6))


# ---------- Subtask 3: Spectral radius of 2x2 matrix ----------

def subtask3_spectral_radius(a: float, b: float, c: float, d: float) -> float:
    """
    Spectral radius = max(|λ1|, |λ2|) for matrix [[a,b],[c,d]].
    """
    trace = a + d
    det = a * d - b * c
    disc = trace * trace - 4.0 * det
    if disc >= 0:
        sqrt_d = math.sqrt(disc)
        lam1 = (trace + sqrt_d) / 2.0
        lam2 = (trace - sqrt_d) / 2.0
        return round(max(abs(lam1), abs(lam2)), 6)
    # Complex conjugate pair: λ = (trace ± i*sqrt(-disc))/2, so |λ|² = (trace/2)² + (sqrt(-disc)/2)² = det → modulus = sqrt(det)
    modulus = math.sqrt(det)
    return round(modulus, 6)


# ---------- Convenience runner (for manual checks) ----------

if __name__ == "__main__":
    # Subtask 1
    out1 = subtask1_logistic(2.5, 100.0, 10.0, 5)
    print("Subtask 1 (r=2.5, K=100, N0=10, t=5):", out1)
    print("Subtask 1 (t=0):", subtask1_logistic(2.5, 100.0, 10.0, 0))

    # Subtask 2
    out2 = subtask2_wilson_ci(100, 30, 0.95)
    print("Subtask 2 (n=100, s=30, alpha=0.95):", out2)

    # Subtask 3
    out3 = subtask3_spectral_radius(1, 0, 0, 1)
    print("Subtask 3 (identity 2x2):", out3)
    print("Subtask 3 (rotation 2x2):", subtask3_spectral_radius(0, 1, -1, 0))
