import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@myboteam/agent-core': path.resolve(__dirname, '../../packages/agent-core/src/index.ts'),
      '@myboteam/agent-core/daemon': path.resolve(
        __dirname,
        '../../packages/agent-core/src/daemon/index.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
