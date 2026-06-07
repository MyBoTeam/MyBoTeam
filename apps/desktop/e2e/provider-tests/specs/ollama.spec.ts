import { ExecutionPage, HomePage, SettingsPage } from '../../pages';
import { expect, test } from '../fixtures';
import { isOllamaInstalled, OllamaTestDriver } from '../helpers/ollama-server';
import { getProviderTestConfig } from '../provider-test-configs';

const config = getProviderTestConfig('ollama');

const ollamaAvailable = !!process.env.E2E_OLLAMA_SERVER_URL || isOllamaInstalled();

test.describe('Ollama Provider', () => {
  test.skip(!ollamaAvailable, 'Ollama not available — skipping');

  const ollama = new OllamaTestDriver(config?.secrets as { serverUrl?: string; modelId?: string });

  test.setTimeout(600000);

  test.beforeAll(ollama.beforeAll);
  test.afterAll(ollama.afterAll);

  test('should connect to Ollama and complete a task', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();
    await settingsPage.selectProvider('ollama');

    await settingsPage.enterOllamaServerUrl(ollama.serverUrl);

    await settingsPage.clickConnect();

    await settingsPage.waitForConnection(60000);

    await settingsPage.selectFirstModel();

    await settingsPage.closeDialog();

    await homePage.enterTask('What is 2 + 2? Reply with just the number.');
    await homePage.submitTask();

    await executionPage.waitForComplete(config?.timeout || 300000);
    const badgeText = await executionPage.statusBadge.textContent();
    expect(badgeText?.toLowerCase()).toContain('completed');
  });
});
