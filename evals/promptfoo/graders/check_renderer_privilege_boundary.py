#!/usr/bin/env python3
"""
Renderer privilege boundary adherence grader.
Generated from goldset criterion: eval-002.
EDD Principle II: binary pass/fail only.
"""

from __future__ import annotations

import json
import sys

from common import SPECIFICATION_FAILURE, binary_result, first_match, load_context


CRITERION = "eval-002"
CRITERION_NAME = "Renderer privilege boundary adherence"

FORBIDDEN_RENDERER_PATTERNS = [
    r"(react|renderer|component|page|zustand|web).{0,80}(import|use|call).{0,20}\bfs\b",
    r"(react|renderer|component|page|web).{0,80}(read|open|write).{0,40}(encrypted key|key file|filesystem|local file)",
    r"(renderer|page|web).{0,80}(daemon socket|json-rpc|local socket)",
    r"(api key|token|credential).{0,80}(web store|zustand store|debug panel|renderer)",
    r"bypass.{0,40}(preload|ipc|typed bridge|window\.myboteam)",
]

APPROVED_BRIDGE_PATTERNS = [
    r"preload",
    r"typed\s+(bridge|wrapper|api)",
    r"window\.myboteam",
    r"daemon\s+(route|api|rpc)",
    r"desktop\s+(bridge|main)",
]


def grade(output: str, context: str | None = None) -> dict:
    """
    Passes when privileged operations are routed through approved boundaries.
    Fails when renderer/web code is instructed to access privileged APIs directly.
    """
    _ = load_context(context)
    violation = first_match(output, FORBIDDEN_RENDERER_PATTERNS)
    if violation:
        return binary_result(
            False,
            f"Renderer privilege boundary violation detected: {violation}",
            criterion=CRITERION,
            criterion_name=CRITERION_NAME,
            evaluator_type="code-based",
            tier=1,
            failure_type=SPECIFICATION_FAILURE,
            confidence=0.95,
        )

    if first_match(output, APPROVED_BRIDGE_PATTERNS):
        reason = "Privileged operation routed through approved bridge or daemon boundary"
    else:
        reason = "No renderer privilege boundary violation detected"

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
