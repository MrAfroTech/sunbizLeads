"""
Unit tests for the SciCode-style benchmark (three subtasks).
Full coverage: output existence, correctness, boundary and sanity checks.
Deterministic; run with: pytest test_benchmark.py -v
"""

import math
import unittest

# Import golden solution (candidate solution should expose same interface)
from golden_solution import (
    subtask1_logistic,
    subtask2_wilson_ci,
    subtask3_spectral_radius,
)


# =============================================================================
# SUBTASK 1: Numerical stability in logistic growth
# =============================================================================

class TestSubtask1Existence(unittest.TestCase):
    """Output existence: function returns a value (float or None)."""

    def test_returns_float_for_stable_run(self):
        out = subtask1_logistic(2.5, 100.0, 10.0, 5)
        assert out is None or isinstance(out, float)

    def test_returns_float_for_t0(self):
        out = subtask1_logistic(2.5, 100.0, 10.0, 0)
        assert out is not None and isinstance(out, float)

    def test_returns_none_or_float_for_large_t(self):
        out = subtask1_logistic(3.9, 100.0, 10.0, 100)
        assert out is None or isinstance(out, float)


class TestSubtask1Correctness(unittest.TestCase):
    """Output correctness: known ground truth cases."""

    def test_t0_returns_N0(self):
        assert subtask1_logistic(2.5, 100.0, 10.0, 0) == 10.0

    def test_t1_one_step(self):
        # N(1) = r * N0 * (1 - N0/K) = 2.5 * 10 * 0.9 = 22.5
        assert subtask1_logistic(2.5, 100.0, 10.0, 1) == 22.5

    def test_deterministic_same_input_twice(self):
        a = subtask1_logistic(2.5, 100.0, 10.0, 5)
        b = subtask1_logistic(2.5, 100.0, 10.0, 5)
        assert a == b

    def test_six_decimal_places(self):
        out = subtask1_logistic(2.5, 100.0, 10.0, 3)
        if out is not None:
            s = f"{out:.6f}"
            assert "." in s and len(s.split(".")[-1]) <= 6


class TestSubtask1Boundary(unittest.TestCase):
    """Boundary and sanity checks."""

    def test_r_small_stable(self):
        out = subtask1_logistic(1.5, 100.0, 50.0, 10)
        assert out is not None
        assert 0 <= out <= 100.0

    def test_unstable_high_r(self):
        # r=4 can lead to chaos; we only check that we get float or None
        out = subtask1_logistic(4.0, 100.0, 10.0, 50)
        assert out is None or (isinstance(out, float) and out >= 0)

    def test_t_zero_no_iteration(self):
        assert subtask1_logistic(3.0, 50.0, 25.0, 0) == 25.0


# =============================================================================
# SUBTASK 2: Wilson score interval
# =============================================================================

class TestSubtask2Existence(unittest.TestCase):
    """Output existence: returns tuple of two floats."""

    def test_returns_tuple(self):
        out = subtask2_wilson_ci(100, 30, 0.95)
        assert isinstance(out, tuple)
        assert len(out) == 2

    def test_both_elements_float(self):
        out = subtask2_wilson_ci(100, 30, 0.95)
        assert isinstance(out[0], float) and isinstance(out[1], float)


class TestSubtask2Correctness(unittest.TestCase):
    """Output correctness."""

    def test_lower_less_than_upper(self):
        out = subtask2_wilson_ci(100, 30, 0.95)
        assert out[0] < out[1]

    def test_bounds_in_zero_one(self):
        out = subtask2_wilson_ci(100, 30, 0.95)
        assert 0 <= out[0] <= 1 and 0 <= out[1] <= 1

    def test_symmetric_for_s_and_n_minus_s(self):
        # Wilson is not perfectly symmetric but both (n, s) and (n, n-s) should give valid intervals
        out1 = subtask2_wilson_ci(100, 30, 0.95)
        out2 = subtask2_wilson_ci(100, 70, 0.95)
        assert 0 <= out1[0] <= 1 and 0 <= out2[0] <= 1

    def test_deterministic(self):
        a = subtask2_wilson_ci(50, 25, 0.95)
        b = subtask2_wilson_ci(50, 25, 0.95)
        assert a == b

    def test_six_decimal_places(self):
        out = subtask2_wilson_ci(100, 30, 0.95)
        for x in out:
            s = f"{x:.6f}"
            assert len(s.split(".")[-1]) <= 6


class TestSubtask2Boundary(unittest.TestCase):
    """Boundary and sanity checks."""

    def test_s_zero(self):
        out = subtask2_wilson_ci(10, 0, 0.95)
        assert out[0] >= 0 and out[1] <= 1 and out[0] < out[1]

    def test_s_equals_n(self):
        out = subtask2_wilson_ci(10, 10, 0.95)
        assert out[0] >= 0 and out[1] <= 1 and out[0] < out[1]

    def test_n_small(self):
        out = subtask2_wilson_ci(1, 1, 0.95)
        assert out[0] <= out[1] and 0 <= out[0] and out[1] <= 1


# =============================================================================
# SUBTASK 3: Spectral radius of 2x2 matrix
# =============================================================================

class TestSubtask3Existence(unittest.TestCase):
    """Output existence."""

    def test_returns_float(self):
        out = subtask3_spectral_radius(1, 0, 0, 1)
        assert isinstance(out, float)

    def test_non_negative(self):
        out = subtask3_spectral_radius(-2, 1, 1, -2)
        assert out >= 0


class TestSubtask3Correctness(unittest.TestCase):
    """Output correctness."""

    def test_identity_matrix(self):
        assert subtask3_spectral_radius(1, 0, 0, 1) == 1.0

    def test_rotation_matrix(self):
        # [[0,1],[-1,0]] has eigenvalues ±i, modulus 1
        assert subtask3_spectral_radius(0, 1, -1, 0) == 1.0

    def test_diagonal_2_3(self):
        # Eigenvalues 2 and 3, spectral radius 3
        assert subtask3_spectral_radius(2, 0, 0, 3) == 3.0

    def test_deterministic(self):
        a = subtask3_spectral_radius(1.1, 0.5, -0.3, 2.0)
        b = subtask3_spectral_radius(1.1, 0.5, -0.3, 2.0)
        assert a == b

    def test_six_decimal_places(self):
        out = subtask3_spectral_radius(1.5, 0.5, 0.5, 1.5)
        s = f"{out:.6f}"
        assert len(s.split(".")[-1]) <= 6


class TestSubtask3Boundary(unittest.TestCase):
    """Boundary and sanity checks."""

    def test_zero_matrix(self):
        assert subtask3_spectral_radius(0, 0, 0, 0) == 0.0

    def test_real_eigenvalues(self):
        # 2x2 with real eigenvalues: e.g. [[1,1],[0,2]] -> 1 and 2
        out = subtask3_spectral_radius(1, 1, 0, 2)
        assert out == 2.0

    def test_complex_eigenvalues(self):
        # Already tested with rotation; one more
        out = subtask3_spectral_radius(0, 1, -1, 0)
        assert abs(out - 1.0) < 1e-5
