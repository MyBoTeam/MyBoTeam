#!/usr/bin/env python3
"""
Validate PromptFoo evaluator implementation without requiring the PromptFoo CLI.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


REQUIRED_GRADERS = [
    "graders/check_pii_leakage.py",
    "graders/check_prompt_injection.py",
    "graders/check_hallucination.py",
    "graders/check_misinformation.py",
    "graders/check_conversation_leakage.py",
    "graders/check_local_privacy_boundary.py",
    "graders/check_renderer_privilege_boundary.py",
    "graders/check_per_task_runtime_isolation.py",
    "graders/check_sensitive_operation_approval.py",
]


def main() -> int:
    missing = [path for path in REQUIRED_GRADERS if not (ROOT / path).exists()]
    if missing:
        print(f"Missing grader files: {missing}", file=sys.stderr)
        return 1

    for config in ("config.js", "config-tier1.js", "config-tier2.js"):
        subprocess.run(["node", "--check", config], cwd=ROOT, check=True)

    goldset = json.loads((ROOT / "goldset.json").read_text())
    if not goldset.get("binary_pass_fail"):
        print("goldset.json must declare binary_pass_fail=true", file=sys.stderr)
        return 1

    sample = subprocess.run(
        [sys.executable, "graders/check_renderer_privilege_boundary.py", "Use the typed preload bridge."],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    result = json.loads(sample.stdout)
    required = {"pass", "score", "binary", "criterion", "routing"}
    if missing_fields := required - set(result):
        print(f"Grader result missing fields: {sorted(missing_fields)}", file=sys.stderr)
        return 1

    print("promptfoo-config-ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
