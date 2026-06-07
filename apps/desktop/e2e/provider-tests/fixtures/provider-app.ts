import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  test as base,
  type ElectronApplication,
  _electron as electron,
  type Page,
} from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type ProviderTestFixtures = {
  electronApp: ElectronApplication;

  window: Page;
};

const APP_RESTART_DELAY = 1500;

const HOME_SCREEN_TIMEOUT = 30000;

export const test = base.extend<ProviderTestFixtures>({
  electronApp: async ({}, use) => {
    const appDir = resolve(__dirname, '../../..');

    const app = await electron.launch({
      args: [
        appDir,

        ...(process.env.DOCKER_ENV === '1' ? ['--no-sandbox', '--disable-gpu'] : []),
      ],
      env: {
        ...process.env,
        CLEAN_START: '1',
        NODE_ENV: 'test',
      },
    });

    const proc = app.process();
    proc.stdout?.on('data', (_data: Buffer) => {});
    proc.stderr?.on('data', (_data: Buffer) => {});

    await use(app);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, APP_RESTART_DELAY));
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('load');

    await window.waitForSelector('[data-testid="task-input-textarea"]', {
      state: 'visible',
      timeout: HOME_SCREEN_TIMEOUT,
    });

    await use(window);
  },
});

export { expect } from '@playwright/test';
