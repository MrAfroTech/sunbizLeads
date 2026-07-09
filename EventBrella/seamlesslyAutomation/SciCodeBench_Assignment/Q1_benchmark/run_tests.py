"""
Run unit tests using only Python stdlib (unittest).
Use: python run_tests.py
If you have pytest: pytest test_benchmark.py -v
"""

import unittest
import sys

# Load the same tests as test_benchmark.py by importing and running unittest
from test_benchmark import (
    TestSubtask1Existence,
    TestSubtask1Correctness,
    TestSubtask1Boundary,
    TestSubtask2Existence,
    TestSubtask2Correctness,
    TestSubtask2Boundary,
    TestSubtask3Existence,
    TestSubtask3Correctness,
    TestSubtask3Boundary,
)


def load_suite():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for cls in (
        TestSubtask1Existence,
        TestSubtask1Correctness,
        TestSubtask1Boundary,
        TestSubtask2Existence,
        TestSubtask2Correctness,
        TestSubtask2Boundary,
        TestSubtask3Existence,
        TestSubtask3Correctness,
        TestSubtask3Boundary,
    ):
        suite.addTests(loader.loadTestsFromTestCase(cls))
    return suite


if __name__ == "__main__":
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(load_suite())
    sys.exit(0 if result.wasSuccessful() else 1)
