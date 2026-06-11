import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.smoke.test.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
  },
});
