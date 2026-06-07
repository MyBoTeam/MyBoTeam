import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import esbuild from 'esbuild';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildThemeInit(): import('vite').Plugin {
  const outfile = path.resolve(__dirname, 'public/theme-init.js');

  async function generate() {
    await esbuild.build({
      stdin: {
        contents: `import { initEarlyTheme } from './src/client/utils/theme-core.js'; initEarlyTheme();`,
        resolveDir: __dirname,
        loader: 'ts',
      },
      bundle: true,
      format: 'iife',
      outfile,
      platform: 'browser',
      minify: false,
    });
  }

  return {
    name: 'build-theme-init',

    async buildStart() {
      await generate();
    },

    configureServer(server) {
      const pending = generate().catch((e) => {
        server.config.logger.error(`[build-theme-init] Failed to generate theme-init.js: ${e}`);
      });
      server.middlewares.use('/theme-init.js', async (_req, _res, next) => {
        await pending;
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [buildThemeInit(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/client'),
      '@myboteam/agent-core/common': path.resolve(
        __dirname,
        '../../packages/agent-core/src/common',
      ),

      '@myboteam/agent-core': path.resolve(__dirname, '../../packages/agent-core/src/common'),
      '@locales': path.resolve(__dirname, 'locales'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  base: './',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      external: [/^@aws-sdk\//],
    },
  },
});
