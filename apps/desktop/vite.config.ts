import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import pkg from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeExternals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

const externalizeNodeModules = (id: string) => {
  if (id.startsWith('@myboteam/') || id.startsWith('@main/')) {
    return false;
  }
  return !id.startsWith('.') && !id.startsWith('/') && !id.includes('\0') && !path.isAbsolute(id);
};

function buildThemeInit(): import('vite').Plugin {
  const outfile = path.resolve(__dirname, 'public/theme-init.js');

  async function generate() {
    await esbuild.build({
      stdin: {
        contents: `import { initEarlyTheme } from '../web/src/client/lib/theme-core.ts'; initEarlyTheme();`,
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

export default defineConfig(() => ({
  plugins: [
    buildThemeInit(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart({ startup }) {
          const inspectArg = process.env.ELECTRON_DEBUG
            ? `--inspect=${process.env.ELECTRON_DEBUG_PORT || '9229'}`
            : undefined;
          const argv = ['.', '--no-sandbox', ...(inspectArg ? [inspectArg] : [])];
          startup(argv);
        },
        vite: {
          resolve: {
            alias: {
              '@main': path.resolve(__dirname, 'src/main'),
              '@myboteam/agent-core': path.resolve(__dirname, '../../packages/agent-core/src'),
            },
          },
          build: {
            sourcemap: true,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: externalizeNodeModules,
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart({ reload }) {
          reload();
        },
        vite: {
          define: {
            'process.env.npm_package_version': JSON.stringify(pkg.version),
          },
          build: {
            outDir: 'dist-electron/preload',
            lib: {
              entry: 'src/preload/index.ts',
              formats: ['cjs'],
              fileName: (format, entryName) =>
                format === 'cjs' ? `${entryName}.cjs` : `${entryName}.mjs`,
            },
            rollupOptions: {
              external: ['electron', ...nodeExternals],
              output: {
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
    ]),
  ],
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
}));
