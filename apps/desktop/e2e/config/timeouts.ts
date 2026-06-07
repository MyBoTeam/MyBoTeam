export const TEST_TIMEOUTS = {
  ANIMATION: 300,

  STATE_UPDATE: 500,

  HYDRATION: 1500,

  APP_RESTART: 1000,

  TASK_COMPLETION: 3000,

  NAVIGATION: 5000,

  PERMISSION_MODAL: 10000,

  TASK_COMPLETE_WAIT: 20000,
} as const;

export const TEST_SCENARIOS = {
  SUCCESS: {
    keyword: '__e2e_success__',
    description: 'Task completes successfully',
  },
  WITH_TOOL: {
    keyword: '__e2e_tool__',
    description: 'Task uses tools (Read, Grep)',
  },
  PERMISSION: {
    keyword: '__e2e_permission__',
    description: 'Task requires file permission',
  },
  ERROR: {
    keyword: '__e2e_error__',
    description: 'Task fails with error',
  },
  INTERRUPTED: {
    keyword: '__e2e_interrupt__',
    description: 'Task is interrupted by user',
  },
  QUESTION: {
    keyword: '__e2e_question__',
    description: 'Task requires user question/choice',
  },
  CODE_BLOCK: {
    keyword: '__e2e_code__',
    description: 'Task response includes code blocks with syntax highlighting',
  },
} as const;

export type TestScenario = keyof typeof TEST_SCENARIOS;
