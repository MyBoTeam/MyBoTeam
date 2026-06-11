const { tier2Criteria, failureRouting } = require('./config.js');

module.exports = {
  description: 'EDD Tier 2 - Goldset Semantic Evaluation',
  prompts: ['Test input for semantic evaluation'],
  providers: ['echo'],
  tests: tier2Criteria,
  outputPath: '../results/tier2_results.json',
  postprocess: failureRouting,
  writeLatestResults: true,
  share: false,
  metadata: {
    version: '0.1.0-provisional',
    tier: 2,
    sla: '5_minutes',
    use_case: 'merge_gate_validation',
    binary_only: true,
  },
};
