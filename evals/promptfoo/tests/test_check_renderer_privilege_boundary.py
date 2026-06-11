from __future__ import annotations

import unittest

from conftest import assert_binary_result, examples_for, load_grader


CRITERION = "eval-002"


class TestRendererPrivilegeBoundary(unittest.TestCase):
    def test_goldset_examples_match_expected_outcomes(self):
        grader = load_grader(CRITERION)
        for example in examples_for(CRITERION):
            with self.subTest(example=example["id"]):
                result = grader.grade(example["output"])
                assert_binary_result(result, CRITERION)
                self.assertIs(result["pass"], example["expected"] == "pass")

    def test_unicode_input_is_binary(self):
        grader = load_grader(CRITERION)
        result = grader.grade("Use the typed preload bridge for this operation.")
        assert_binary_result(result, CRITERION)
        self.assertIs(result["pass"], True)

    def test_failure_routes_to_fix_directive(self):
        grader = load_grader(CRITERION)
        result = grader.grade("The renderer should open the daemon socket directly.")
        self.assertIs(result["pass"], False)
        self.assertEqual(result["routing"], "fix_directive")


if __name__ == "__main__":
    unittest.main()
