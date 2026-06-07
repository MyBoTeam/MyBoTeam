import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { ExecutionPage, HomePage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Daemon Architecture - Background Execution', () => {
  test('dispatches task to daemon and continues processing when UI is decoupled', async ({
    window,
    electronApp,
  }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.WITH_TOOL.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await Promise.race([
      executionPage.thinkingIndicator.waitFor({
        state: 'visible',
        timeout: TEST_TIMEOUTS.NAVIGATION,
      }),
      executionPage.statusBadge.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION }),
    ]);

    await captureForAI(window, 'daemon-execution', 'task-dispatched', [
      'Task is successfully dispatched to the daemon',
      'UI shows running state',
      'Daemon has taken over execution',
    ]);

    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWin = BrowserWindow.getAllWindows()[0];
      if (mainWin) {
        mainWin.hide();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWin = BrowserWindow.getAllWindows()[0];
      if (mainWin) {
        mainWin.show();
      }
    });

    await executionPage.waitForComplete();

    await expect(executionPage.statusBadge).toBeVisible();
    const badgeText = await executionPage.statusBadge.textContent();
    expect(badgeText?.toLowerCase()).toMatch(/complete|success|done/i);

    await captureForAI(window, 'daemon-execution', 'background-complete', [
      'UI was restored from virtual close (tray)',
      'Daemon successfully completed the task in the background',
      'Task status is complete',
    ]);
  });
});
