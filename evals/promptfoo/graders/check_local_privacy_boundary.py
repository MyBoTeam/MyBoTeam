#!/usr/bin/env python3
"""
Local privacy boundary preservation grader.
Generated from goldset criterion: eval-001.
EDD Principle II: binary pass/fail only.
"""

from __future__ import annotations

import json
import sys

from common import SPECIFICATION_FAILURE, binary_result, first_match, load_context


CRITERION = "eval-001"
CRITERION_NAME = "Local privacy boundary preservation"

UNAPPROVED_CLOUD_PATTERNS = [
    r"myboteam\s+(cloud|server|service|backend)",
    r"(sync|upload|mirror|backup).{0,40}(myboteam|cloud|server|service|backend)",
    r"(task|message|workspace|credential|api key|token).{0,50}(sync|upload|mirror|backup)",
    r"support.{0,40}(inspect|access|review).{0,40}(workspace|files|messages|tasks)",
]

APPROVED_EXTERNAL_PATTERNS = [
    r"user-configured",
    r"configured\s+(provider|connector|model)",
    r"only\s+if\s+you\s+configure",
    r"locally",
    r"encrypted\s+storage",
    r"no\s+hosted\s+myboteam\s+backend",
]


def grade(output: str, context: str | None = None) -> dict:
    """
    Passes when output preserves local-first privacy boundaries.
    Fails on invented hosted backend, sync, backup, or support-access claims.
    """
    _ = load_context(context)
    violation = first_match(output, UNAPPROVED_CLOUD_PATTERNS)
    if violation:
        approved = first_match(output, APPROVED_EXTERNAL_PATTERNS)
        if not approved:
            return binary_result(
                False,
                f"Unapproved local-data cloud claim detected: {violation}",
                criterion=CRITERION,
                criterion_name=CRITERION_NAME,
                evaluator_type="code-plus-llm-judge",
                tier=2,
                failure_type=SPECIFICATION_FAILURE,
                confidence=0.9,
            )

    return binary_result(
        True,
        "Local-first privacy boundary preserved",
        criterion=CRITERION,
        criterion_name=CRITERION_NAME,
        evaluator_type="code-plus-llm-judge",
        tier=2,
        failure_type=SPECIFICATION_FAILURE,
    )


if __name__ == "__main__":
    output = sys.argv[1] if len(sys.argv) > 1 else ""
    context = sys.argv[2] if len(sys.argv) > 2 else None
    print(json.dumps(grade(output, context)))
