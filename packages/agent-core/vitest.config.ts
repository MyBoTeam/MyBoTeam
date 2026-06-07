import { defineConfig } from 'vitest/config';

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
const node22RequiredTests =
  nodeMajor < 22
    ? [
        'tests/unit/providers/ollama.test.ts',
        'tests/unit/providers/tool-support-testing.test.ts',
        'tests/unit/providers/validation.test.ts',
        'tests/unit/utils/fetch.test.ts',
      ]
    : [];

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: node22RequiredTests,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: { statements: 50, branches: 45, functions: 50, lines: 50 },
    },
  },
});
