import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'daemon/index': 'src/daemon/index.ts',
    'storage/migrations/index': 'src/storage/migrations/index.ts',
    'storage/seeds/index': 'src/storage/seeds/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['better-sqlite3'],
});
