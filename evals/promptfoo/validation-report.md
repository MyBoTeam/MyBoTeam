# EDD Validation Report

Generated: 2026-06-10T03:24:31.994416+00:00
System: promptfoo
Goldset version: 0.1.0-provisional
Status: provisional
PromptFoo CLI: not installed

## Summary

- Examples validated: 20
- Overall accuracy: 100.00%
- 95% Wilson CI: 83.89% - 100.00%
- Holdout accuracy: 4/4
- Binary pass/fail compliance: pass
- PromptFoo CLI execution: pending local install; covered by CI workflow

## Per-Criterion Metrics

| Criterion | Tier | Examples | Accuracy | TPR | TNR | Max Latency | Status |
|-----------|------|----------|----------|-----|-----|-------------|--------|
| eval-001 | 2 | 5 | 100.00% | 100.00% | 100.00% | 0.000610s | pass |
| eval-002 | 1 | 5 | 100.00% | 100.00% | 100.00% | 0.000818s | pass |
| eval-003 | 1 | 5 | 100.00% | 100.00% | 100.00% | 0.000797s | pass |
| eval-004 | 2 | 5 | 100.00% | 100.00% | 100.00% | 0.000842s | pass |

## EDD Compliance

| Principle | Validation | Status |
|-----------|------------|--------|
| I - Spec-driven contracts | Criteria map to architecture-derived pass/fail contracts | provisional |
| II - Binary pass/fail | All grader outputs use score 1.0 or 0.0 only | pass |
| III - Error analysis | Drafts are not trace-saturated | pending traces |
| IV - Evaluation pyramid | Tier 1 and Tier 2 configs exist and pass syntax checks | pass |
| V - Trajectory observability | Result records include example-level outputs | pass |
| VI - RAG decomposition | Not applicable to current product scope | n/a |
| VII - Annotation queues | Annotation routing config exists | pass |
| VIII - Close production loop | Failure routing metadata returns fix/evaluator routes | pass |
| IX - Test data as code | Goldset and validation artifacts are versionable | pass |
| X - Cross-functional observability | Human-review queues and report are present | pass |

## Production Readiness

Result: not production-ready yet. The evaluator implementation is internally valid, but the goldset remains provisional because no production trace corpus has been analyzed and PromptFoo CLI was not executed locally.

Required before promotion:

- Analyze at least 20 full task or conversation traces.
- Reassess theoretical saturation.
- Run PromptFoo CLI in CI or a local environment with PromptFoo installed.
- Recompute validation results after real trace-backed examples are added.
