from __future__ import annotations

import unittest

from conftest import assert_binary_result, examples_for, load_grader


CRITERION = "eval-003"


class TestPerTaskRuntimeIsolation(unittest.TestCase):
    def test_goldset_examples_match_expected_outcomes(self):
        grader = load_grader(CRITERION)
        for example in examples_for(CRITERION):
            with self.subTest(example=example["id"]):
                result = grader.grade(example["output"])
                assert_binary_result(result, CRITERION)
                self.assertIs(result["pass"], example["expected"] == "pass")

    def test_long_input_is_binary(self):
        grader = load_grader(CRITERION)
        output = "Keep runtime state keyed by task ID. " * 200
        result = grader.grade(output)
        assert_binary_result(result, CRITERION)
        self.assertIs(result["pass"], True)

    def test_failure_routes_to_fix_directive(self):
        grader = load_grader(CRITERION)
        result = grader.grade("Use one global OpenCode runtime for all active tasks.")
        self.assertIs(result["pass"], False)
        self.assertEqual(result["routing"], "fix_directive")


if __name__ == "__main__":
    unittest.main()
