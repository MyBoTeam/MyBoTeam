import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  clean: true,
  splitting: false,
  sourcemap: true,

  external: ['@myboteam/llm-gateway-client'],

  noExternal: [
    '@myboteam/agent-core',
    '@opencode-ai/sdk',
    'zod',
    '@whiskeysockets/baileys',
    'pino',
  ],
});
