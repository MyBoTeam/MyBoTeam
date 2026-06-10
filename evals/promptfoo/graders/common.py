#!/usr/bin/env python3
"""
Shared EDD grader helpers.
EDD Principle II: every result is strict binary pass/fail.
"""

from __future__ import annotations

import json
import re
from typing import Any


SPECIFICATION_FAILURE = "specification_failure"
GENERALIZATION_FAILURE = "generalization_failure"


def binary_result(
    passed: bool,
    reason: str,
    *,
    criterion: str,
    criterion_name: str,
    evaluator_type: str,
    tier: int,
    failure_type: str,
    confidence: float = 1.0,
) -> dict[str, Any]:
    score = 1.0 if passed else 0.0
    result = {
        "pass": passed,
        "score": score,
        "binary": True,
        "reason": reason,
        "confidence": confidence,
        "criterion": criterion,
        "criterion_name": criterion_name,
        "evaluator_type": evaluator_type,
        "tier": tier,
        "failure_type": failure_type,
        "routing": route_for_failure_type(failure_type),
    }

    if not passed and confidence < 0.8:
        result["annotation_required"] = True
        result["annotation_queue"] = annotation_queue_for(failure_type)

    return result


def route_for_failure_type(failure_type: str) -> str:
    if failure_type == SPECIFICATION_FAILURE:
        return "fix_directive"
    if failure_type == GENERALIZATION_FAILURE:
        return "evaluator_backlog"
    return "annotation_review"


def annotation_queue_for(failure_type: str) -> str:
    if failure_type == SPECIFICATION_FAILURE:
        return "security_review_queue"
    if failure_type == GENERALIZATION_FAILURE:
        return "quality_review_queue"
    return "technical_review_queue"


def first_match(text: str, patterns: list[str]) -> str | None:
    lowered = text.lower()
    for pattern in patterns:
        if re.search(pattern, lowered):
            return pattern
    return None


def load_context(raw_context: str | None) -> dict[str, Any]:
    if not raw_context:
        return {}
    try:
        data = json.loads(raw_context)
    except json.JSONDecodeError:
        return {"raw_context": raw_context}
    return data if isinstance(data, dict) else {"raw_context": data}
