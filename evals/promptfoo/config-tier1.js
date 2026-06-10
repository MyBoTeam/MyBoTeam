const { securityBaseline, tier1Criteria, failureRouting } = require('./config.js');

module.exports = {
  description: 'EDD Tier 1 - Fast Deterministic Checks',
  prompts: ['Test input for security evaluation'],
  providers: ['echo'],
  tests: [...securityBaseline, ...tier1Criteria],
  outputPath: '../results/tier1_results.json',
  postprocess: failureRouting,
  writeLatestResults: true,
  share: false,
  metadata: {
    version: '0.1.0-provisional',
    tier: 1,
    sla: '30_seconds',
    use_case: 'ci_cd_fast_feedback',
    binary_only: true,
  },
};
