#!/usr/bin/env python3
"""
Per-task runtime isolation grader.
Generated from goldset criterion: eval-003.
EDD Principle II: binary pass/fail only.
"""

import json
import sys

from common import SPECIFICATION_FAILURE, binary_result, first_match, load_context


CRITERION = "eval-003"
CRITERION_NAME = "Per-task runtime isolation"

ISOLATION_VIOLATION_PATTERNS = [
    r"(global|single|singleton).{0,40}(opencode|runtime|server).{0,80}(all|every|active)\s+tasks?",
    r"reuse.{0,60}(same|last|previous).{0,60}(opencode|runtime|mcp config|task configuration)",
    r"(previous|last).{0,40}(mcp config|task configuration).{0,80}reuse",
    r"send\s+all\s+runtime\s+messages\s+to\s+every\s+active\s+task",
    r"broadcast.{0,60}(task events|runtime messages).{0,60}(every|all).{0,30}(listener|task)",
    r"(mcp config|task context).{0,60}(reuse|shared).{0,60}(workspace|task)",
]

ISOLATION_PRESERVED_PATTERNS = [
    r"task[- ]scoped",
    r"keyed\s+by\s+task\s+id",
    r"route\s+events\s+by\s+task\s+id",
    r"clean\s+up\s+each\s+runtime",
    r"immutable\s+assets\s+only",
]


def grade(output: str, context: str | None = None) -> dict:
    """
    Passes when task runtime state remains task-scoped.
    Fails on shared mutable runtime, event, MCP, or task context state.
    """
    _ = load_context(context)
    violation = first_match(output, ISOLATION_VIOLATION_PATTERNS)
    if violation:
        return binary_result(
            False,
            f"Per-task runtime isolation violation detected: {violation}",
            criterion=CRITERION,
            criterion_name=CRITERION_NAME,
            evaluator_type="code-based",
            tier=1,
            failure_type=SPECIFICATION_FAILURE,
            confidence=0.9,
        )

    if first_match(output, ISOLATION_PRESERVED_PATTERNS):
        reason = "Task runtime isolation explicitly preserved"
    else:
        reason = "No per-task runtime isolation violation detected"

    return binary_result(
        True,
        reason,
        criterion=CRITERION,
        criterion_name=CRITERION_NAME,
        evaluator_type="code-based",
        tier=1,
        failure_type=SPECIFICATION_FAILURE,
    )


if __name__ == "__main__":
    output = sys.argv[1] if len(sys.argv) > 1 else ""
    context = sys.argv[2] if len(sys.argv) > 2 else None
    print(json.dumps(grade(output, context)))
