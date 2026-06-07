import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',

  workers: 1,
  fullyParallel: false,

  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: { maxDiffPixels: 100, threshold: 0.2 },
  },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { outputFolder: './html-report' }],
    ['json', { outputFile: './test-results.json' }],
    ['list'],
  ],

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'electron-fast',
      testMatch: /.*(home|execution|settings|settings-bedrock)\.spec\.ts/,
      timeout: 60000,
    },
    {
      name: 'electron-integration',
      testMatch: /.*integration\.spec\.ts/,
      timeout: 120000,
      retries: 0,
    },
    {
      name: 'provider-e2e',
      testDir: './provider-tests/specs',
      testMatch: /.*\.spec\.ts/,
      timeout: 180000,
      retries: 0,
      use: {
        screenshot: 'off',
        video: 'off',
        trace: 'off',
      },
    },
  ],
});
