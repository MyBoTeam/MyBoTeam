from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path


EVAL_ROOT = Path(__file__).resolve().parents[1]
GRADERS_DIR = EVAL_ROOT / "graders"
GOLDSET_PATH = EVAL_ROOT / "goldset.json"

sys.path.insert(0, str(GRADERS_DIR))


CRITERION_MODULES = {
    "eval-001": "check_local_privacy_boundary",
    "eval-002": "check_renderer_privilege_boundary",
    "eval-003": "check_per_task_runtime_isolation",
    "eval-004": "check_sensitive_operation_approval",
}


def load_goldset() -> dict:
    return json.loads(GOLDSET_PATH.read_text())


def load_grader(criterion_id: str):
    module_name = CRITERION_MODULES[criterion_id]
    return importlib.import_module(module_name)


def examples_for(criterion_id: str) -> list[dict]:
    goldset = load_goldset()
    return [example for example in goldset["examples"] if example["criterion_id"] == criterion_id]


def assert_binary_result(result: dict, criterion_id: str) -> None:
    required_fields = {
        "pass",
        "score",
        "binary",
        "reason",
        "confidence",
        "criterion",
        "criterion_name",
        "evaluator_type",
        "tier",
        "failure_type",
        "routing",
    }
    missing = required_fields - set(result)
    assert not missing, f"Missing result fields: {sorted(missing)}"
    assert result["criterion"] == criterion_id
    assert result["pass"] in {True, False}
    assert result["score"] in {0.0, 1.0}
    assert result["binary"] is True
    assert result["score"] == (1.0 if result["pass"] else 0.0)
