import { defineConfig } from 'vitest/config';
import path from 'node:path';

const alias = {
  '@myboteam/agent-core': path.resolve(__dirname, 'packages/agent-core/src/index.ts'),
  '@myboteam/agent-core/daemon': path.resolve(__dirname, 'packages/agent-core/src/daemon/index.ts'),
  '@myboteam/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        test: {
          name: 'agent-core',
          globals: true,
          environment: 'node',
          include: ['packages/agent-core/tests/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'daemon',
          globals: true,
          environment: 'node',
          include: ['apps/daemon/tests/**/*.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
