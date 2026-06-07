import { ExecutionPage, HomePage, SettingsPage } from '../../pages';
import { expect, test } from '../fixtures';
import { DEFAULT_TEST_MODELS, getProviderTestConfig } from '../provider-test-configs';
import type { ApiKeySecrets } from '../types';

const config = getProviderTestConfig('google');

test.describe('Google Provider', () => {
  test.skip(!config?.secrets, 'No Google secrets configured — skipping');

  test('should connect with API key and complete a task', async ({ window }) => {
    const secrets = config.secrets as ApiKeySecrets;

    const settingsPage = new SettingsPage(window);
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await settingsPage.navigateToSettings();

    await settingsPage.selectProvider('google');

    await settingsPage.enterApiKey(secrets.apiKey);

    await settingsPage.clickConnect();

    await settingsPage.waitForConnection();

    const modelId = config.modelId || DEFAULT_TEST_MODELS.google;

    if (modelId) {
      await settingsPage.selectModel(modelId);
    }

    await settingsPage.closeDialog();

    await homePage.enterTask('Create a plan and mark it as completed.');
    await homePage.submitTask();

    await executionPage.waitForComplete(config.timeout || 180000);

    const badgeText = await executionPage.statusBadge.textContent();

    expect(badgeText?.toLowerCase()).toContain('completed');
  });
});
