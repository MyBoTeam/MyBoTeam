---
id: eval-XXX
status: draft
name: "{Eval Name}"
description: "{Description from error analysis}"

pass_condition: "{Precise spec constraint}"
fail_condition: "{Precise spec violation}"

failure_type:
  specification_failure:
    action: fix_directive
  generalization_failure:
    action: build_evaluator
    evaluator_type: code-based | llm-judge

error_analysis:
  traces_analyzed: 0
  theoretical_saturation: false
  open_coding_notes: |
    {Bottom-up notes from human trace review}
---

# {Eval Name}

## Error Analysis Notes

{Human error analysis findings}

## Examples

### Pass Examples

- {Example that should pass the evaluation}

### Fail Examples

- {Example that should fail the evaluation}
