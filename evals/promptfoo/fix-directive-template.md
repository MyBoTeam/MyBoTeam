# Fix Directive: {criterion_name}

Criterion: {criterion_id}
Failure Type: Specification Failure
Priority: {priority_level}

## Issue Description

Failed evaluation: {criterion_name}
Failure reason: {failure_reason}

## Required Fix

The behavior violates this pass condition:

{pass_condition}

Observed behavior:

{actual_behavior}

## Validation Criteria

- The criterion's goldset pass examples pass.
- The criterion's goldset fail examples fail.
- No other goldset criterion regresses.
