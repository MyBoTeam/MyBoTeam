# Evaluator Backlog: {criterion_name}

Criterion: {criterion_id}
Failure Type: Generalization Failure
Build Priority: {priority_level}

## Continuous Evaluation Need

Failure pattern: {failure_pattern_description}
Generalization gap: {generalization_issue}

## Evaluator Requirements

- Maintain strict binary pass/fail output.
- Validate against goldset train examples.
- Validate against holdout examples before promotion.
- Route ambiguous failures to the annotation queue.

## Success Metrics

- Greater than 90% accuracy on seed goldset examples.
- Greater than 85% accuracy on holdout examples.
- No non-binary scores.
