import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@myboteam/agent-core/common': path.resolve(
        __dirname,
        '../../packages/agent-core/src/common',
      ),
      '@myboteam/agent-core': path.resolve(__dirname, '../../packages/agent-core/src'),
    },
  },
  test: {
    globals: true,
    root: __dirname,
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', '**/release/**'],
    setupFiles: ['__tests__/setup.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      enabled: false,
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/main/store/freshInstallCleanup.ts',
        'src/main/test-utils/**',
      ],
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 44,
        lines: 50,
      },
    },
    testTimeout: 5000,
    hookTimeout: 10000,
    retry: 0,
    reporters: ['default'],
    watch: false,
  },
});
