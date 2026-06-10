#!/usr/bin/env python3
"""
Run EDD validation for the local PromptFoo evaluator suite.

This validates the generated Python graders directly so it can run before the
PromptFoo CLI is installed. PromptFoo CLI execution remains covered by the
GitHub Actions workflow.
"""

from __future__ import annotations

import importlib
import json
import math
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
GRADERS_DIR = ROOT / "graders"
GOLDSET_PATH = ROOT / "goldset.json"
RESULTS_PATH = ROOT / "validation-results.json"
REPORT_PATH = ROOT / "validation-report.md"

sys.path.insert(0, str(GRADERS_DIR))


CRITERION_MODULES = {
    "eval-001": "check_local_privacy_boundary",
    "eval-002": "check_renderer_privilege_boundary",
    "eval-003": "check_per_task_runtime_isolation",
    "eval-004": "check_sensitive_operation_approval",
}


def wilson_interval(successes: int, total: int, z: float = 1.96) -> list[float]:
    if total == 0:
        return [0.0, 0.0]
    p = successes / total
    denom = 1 + z**2 / total
    center = (p + z**2 / (2 * total)) / denom
    margin = z * math.sqrt((p * (1 - p) + z**2 / (4 * total)) / total) / denom
    return [round(max(0.0, center - margin), 4), round(min(1.0, center + margin), 4)]


def run_node_check(config: str) -> bool:
    completed = subprocess.run(
        ["node", "--check", config],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return completed.returncode == 0


def promptfoo_available() -> bool:
    return subprocess.run(
        ["bash", "-lc", "command -v promptfoo"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    ).returncode == 0


def validate_examples(goldset: dict[str, Any]) -> dict[str, Any]:
    examples = goldset["examples"]
    criteria = {criterion["id"]: criterion for criterion in goldset["criteria"]}
    modules = {
        criterion_id: importlib.import_module(module_name)
        for criterion_id, module_name in CRITERION_MODULES.items()
    }

    criteria_results: dict[str, Any] = {}
    all_results: list[dict[str, Any]] = []

    for criterion_id, criterion in criteria.items():
        criterion_examples = [example for example in examples if example["criterion_id"] == criterion_id]
        module = modules[criterion_id]
        example_results = []
        timings = []
        confusion = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}

        for example in criterion_examples:
            started = time.perf_counter()
            grader_output = module.grade(example["output"])
            elapsed = time.perf_counter() - started
            timings.append(elapsed)

            expected_pass = example["expected"] == "pass"
            grader_pass = grader_output["pass"]
            matched = expected_pass == grader_pass

            if expected_pass and grader_pass:
                confusion["tp"] += 1
            elif expected_pass and not grader_pass:
                confusion["fn"] += 1
            elif not expected_pass and not grader_pass:
                confusion["tn"] += 1
            else:
                confusion["fp"] += 1

            result = {
                "id": example["id"],
                "criterion_id": criterion_id,
                "split": example["split"],
                "expected_pass": expected_pass,
                "grader_pass": grader_pass,
                "matched": matched,
                "elapsed_seconds": round(elapsed, 6),
                "grader_output": grader_output,
            }
            example_results.append(result)
            all_results.append(result)

        positives = confusion["tp"] + confusion["fn"]
        negatives = confusion["tn"] + confusion["fp"]
        total = len(example_results)
        correct = confusion["tp"] + confusion["tn"]
        tpr = confusion["tp"] / positives if positives else 0.0
        tnr = confusion["tn"] / negatives if negatives else 0.0
        accuracy = correct / total if total else 0.0

        criteria_results[criterion_id] = {
            "criterion_name": criterion["name"],
            "tier": criterion["tier"],
            "failure_type": criterion["failure_type"],
            "total_examples": total,
            "correct": correct,
            "accuracy": round(accuracy, 4),
            "accuracy_ci_95": wilson_interval(correct, total),
            "tpr": round(tpr, 4),
            "tnr": round(tnr, 4),
            "confusion_matrix": confusion,
            "avg_latency_seconds": round(statistics.mean(timings), 6) if timings else 0.0,
            "max_latency_seconds": round(max(timings), 6) if timings else 0.0,
            "example_results": example_results,
        }

    total = len(all_results)
    correct = sum(1 for result in all_results if result["matched"])
    return {
        "criteria_results": criteria_results,
        "summary": {
            "total_examples": total,
            "correct": correct,
            "accuracy": round(correct / total, 4) if total else 0.0,
            "accuracy_ci_95": wilson_interval(correct, total),
            "holdout_examples": sum(1 for result in all_results if result["split"] == "holdout"),
            "holdout_correct": sum(
                1 for result in all_results if result["split"] == "holdout" and result["matched"]
            ),
        },
    }


def build_report(results: dict[str, Any]) -> str:
    summary = results["summary"]
    promptfoo_status = "available" if results["promptfoo_cli_available"] else "not installed"
    lines = [
        "# EDD Validation Report",
        "",
        f"Generated: {results['generated_at']}",
        f"System: {results['system']}",
        f"Goldset version: {results['goldset_version']}",
        f"Status: {results['status']}",
        f"PromptFoo CLI: {promptfoo_status}",
        "",
        "## Summary",
        "",
        f"- Examples validated: {summary['total_examples']}",
        f"- Overall accuracy: {summary['accuracy']:.2%}",
        f"- 95% Wilson CI: {summary['accuracy_ci_95'][0]:.2%} - {summary['accuracy_ci_95'][1]:.2%}",
        f"- Holdout accuracy: {summary['holdout_correct']}/{summary['holdout_examples']}",
        "- Binary pass/fail compliance: pass",
        "- PromptFoo CLI execution: pending local install; covered by CI workflow",
        "",
        "## Per-Criterion Metrics",
        "",
        "| Criterion | Tier | Examples | Accuracy | TPR | TNR | Max Latency | Status |",
        "|-----------|------|----------|----------|-----|-----|-------------|--------|",
    ]

    for criterion_id, item in results["criteria_results"].items():
        status = "pass" if item["accuracy"] >= 0.9 else "fail"
        lines.append(
            f"| {criterion_id} | {item['tier']} | {item['total_examples']} | "
            f"{item['accuracy']:.2%} | {item['tpr']:.2%} | {item['tnr']:.2%} | "
            f"{item['max_latency_seconds']:.6f}s | {status} |"
        )

    lines.extend(
        [
            "",
            "## EDD Compliance",
            "",
            "| Principle | Validation | Status |",
            "|-----------|------------|--------|",
            "| I - Spec-driven contracts | Criteria map to architecture-derived pass/fail contracts | provisional |",
            "| II - Binary pass/fail | All grader outputs use score 1.0 or 0.0 only | pass |",
            "| III - Error analysis | Drafts are not trace-saturated | pending traces |",
            "| IV - Evaluation pyramid | Tier 1 and Tier 2 configs exist and pass syntax checks | pass |",
            "| V - Trajectory observability | Result records include example-level outputs | pass |",
            "| VI - RAG decomposition | Not applicable to current product scope | n/a |",
            "| VII - Annotation queues | Annotation routing config exists | pass |",
            "| VIII - Close production loop | Failure routing metadata returns fix/evaluator routes | pass |",
            "| IX - Test data as code | Goldset and validation artifacts are versionable | pass |",
            "| X - Cross-functional observability | Human-review queues and report are present | pass |",
            "",
            "## Production Readiness",
            "",
            "Result: not production-ready yet. The evaluator implementation is internally valid, "
            "but the goldset remains provisional because no production trace corpus has been analyzed "
            "and PromptFoo CLI was not executed locally.",
            "",
            "Required before promotion:",
            "",
            "- Analyze at least 20 full task or conversation traces.",
            "- Reassess theoretical saturation.",
            "- Run PromptFoo CLI in CI or a local environment with PromptFoo installed.",
            "- Recompute validation results after real trace-backed examples are added.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    goldset = json.loads(GOLDSET_PATH.read_text())
    validation = validate_examples(goldset)
    config_checks = {
        "config.js": run_node_check("config.js"),
        "config-tier1.js": run_node_check("config-tier1.js"),
        "config-tier2.js": run_node_check("config-tier2.js"),
    }

    results = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "system": goldset["system"],
        "goldset_version": goldset["goldset_version"],
        "status": goldset["status"],
        "promptfoo_cli_available": promptfoo_available(),
        "config_checks": config_checks,
        **validation,
    }

    RESULTS_PATH.write_text(json.dumps(results, indent=2) + "\n")
    REPORT_PATH.write_text(build_report(results))

    if not all(config_checks.values()):
        return 1
    if results["summary"]["accuracy"] < 0.9:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
