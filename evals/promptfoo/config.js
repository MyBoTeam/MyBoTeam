const fs = require('node:fs');
const path = require('node:path');

function grader(code) {
  return { type: 'python', value: code };
}

function loadGrader(name) {
  const graderCode = fs.readFileSync(path.join(__dirname, 'graders', name), 'utf-8');
  if (graderCode.includes('from common import')) {
    const commonCode = fs.readFileSync(path.join(__dirname, 'graders', 'common.py'), 'utf-8');
    const stripped = graderCode.replace(/^from common import .+$/m, '');
    return commonCode + '\n' + stripped;
  }
  return graderCode;
}

const securityBaseline = [
  {
    description: 'Security Baseline - PII Leakage',
    assert: [grader(loadGrader('check_pii_leakage.py'))],
    metadata: { tier: 1, type: 'security_baseline', priority: 'critical' },
  },
  {
    description: 'Security Baseline - Prompt Injection',
    assert: [grader(loadGrader('check_prompt_injection.py'))],
    metadata: { tier: 1, type: 'security_baseline', priority: 'critical' },
  },
  {
    description: 'Security Baseline - Hallucination Detection',
    assert: [grader(loadGrader('check_hallucination.py'))],
    metadata: { tier: 1, type: 'security_baseline', priority: 'critical' },
  },
  {
    description: 'Security Baseline - Misinformation Detection',
    assert: [grader(loadGrader('check_misinformation.py'))],
    metadata: { tier: 1, type: 'security_baseline', priority: 'critical' },
  },
  {
    description: 'Security Baseline - Conversation Leakage',
    assert: [grader(loadGrader('check_conversation_leakage.py'))],
    metadata: { tier: 1, type: 'security_baseline', priority: 'critical' },
  },
];

const tier1Criteria = [
  {
    description: 'Renderer Privilege Boundary Adherence',
    assert: [grader(loadGrader('check_renderer_privilege_boundary.py'))],
    metadata: {
      tier: 1,
      type: 'goldset_criterion',
      criterion: 'eval-002',
      failure_type: 'specification_failure',
      evaluator_type: 'code-based',
    },
  },
  {
    description: 'Per-Task Runtime Isolation',
    assert: [grader(loadGrader('check_per_task_runtime_isolation.py'))],
    metadata: {
      tier: 1,
      type: 'goldset_criterion',
      criterion: 'eval-003',
      failure_type: 'specification_failure',
      evaluator_type: 'code-based',
    },
  },
];

const tier2Criteria = [
  {
    description: 'Local Privacy Boundary Preservation',
    assert: [grader(loadGrader('check_local_privacy_boundary.py'))],
    metadata: {
      tier: 2,
      type: 'goldset_criterion',
      criterion: 'eval-001',
      failure_type: 'specification_failure',
      evaluator_type: 'code-plus-llm-judge',
    },
  },
  {
    description: 'Sensitive Operation Approval and Visibility',
    assert: [grader(loadGrader('check_sensitive_operation_approval.py'))],
    metadata: {
      tier: 2,
      type: 'goldset_criterion',
      criterion: 'eval-004',
      failure_type: 'generalization_failure',
      evaluator_type: 'llm-judge',
    },
  },
];

const failureRouting = {
  specification_failures: {
    action: 'generate_fix_directive',
    output_path: '../results/fix_directives.json',
  },
  generalization_failures: {
    action: 'build_evaluator_backlog',
    output_path: '../results/evaluator_backlog.json',
  },
  annotation_queue: {
    risk_threshold: 0.8,
    output_path: '../results/annotation_queue.json',
    human_review_required: true,
  },
};

module.exports = {
  description: 'EDD Evaluation Suite - Binary Pass/Fail with Evaluation Pyramid',
  tests: [...securityBaseline, ...tier1Criteria, ...tier2Criteria],
  outputPath: '../results/promptfoo_results.json',
  postprocess: failureRouting,
  writeLatestResults: true,
  share: false,
  metadata: {
    version: '0.1.0-provisional',
    goldset_version: '0.1.0-provisional',
    edd_compliant: true,
    binary_only: true,
    evaluation_pyramid: true,
    tier1_sla: '30_seconds',
    tier2_sla: '5_minutes',
    criteria_mapping: {
      'eval-001': {
        name: 'Local privacy boundary preservation',
        failure_type: 'specification_failure',
      },
      'eval-002': {
        name: 'Renderer privilege boundary adherence',
        failure_type: 'specification_failure',
      },
      'eval-003': {
        name: 'Per-task runtime isolation',
        failure_type: 'specification_failure',
      },
      'eval-004': {
        name: 'Sensitive operation approval and visibility',
        failure_type: 'generalization_failure',
      },
    },
  },
};

module.exports.securityBaseline = securityBaseline;
module.exports.tier1Criteria = tier1Criteria;
module.exports.tier2Criteria = tier2Criteria;
module.exports.failureRouting = failureRouting;
