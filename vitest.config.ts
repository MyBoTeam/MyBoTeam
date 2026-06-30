import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@myboteam/agent-core': path.resolve(__dirname, 'packages/agent-core/src/index.ts'),
      '@myboteam/agent-core/daemon': path.resolve(__dirname, 'packages/agent-core/src/daemon/index.ts'),
      '@myboteam/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/tests/**/*.test.ts', 'apps/*/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
