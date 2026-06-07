import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  test as base,
  type ElectronApplication,
  _electron as electron,
  type Page,
} from '@playwright/test';
import { TEST_TIMEOUTS } from '../config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type ElectronFixtures = {
  electronApp: ElectronApplication;

  window: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const mainPath = resolve(__dirname, '../../dist-electron/main/index.js');

    const app = await electron.launch({
      args: [
        mainPath,
        '--e2e-skip-auth',
        '--e2e-mock-tasks',

        ...(process.env.DOCKER_ENV === '1' ? ['--no-sandbox', '--disable-gpu'] : []),
      ],
      env: {
        ...process.env,
        E2E_SKIP_AUTH: '1',
        E2E_MOCK_TASK_EVENTS: '1',
        CLEAN_START: '1',
        NODE_ENV: 'test',
      },
    });

    await use(app);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUTS.APP_RESTART));
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();

    await window.waitForLoadState('load');

    await window.waitForSelector('[data-testid="task-input-textarea"]', {
      state: 'visible',
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await use(window);
  },
});

export { expect } from '@playwright/test';
