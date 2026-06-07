import { ExecutionPage, HomePage, SettingsPage } from '../../pages';
import { expect, test } from '../fixtures';
import { getProviderTestConfig } from '../provider-test-configs';
import type { BedrockApiKeySecrets } from '../types';

const config = getProviderTestConfig('bedrock-api-key');

test.describe('Bedrock Provider (API Key)', () => {
  test.skip(!config?.secrets, 'No Bedrock API Key secrets configured — skipping');

  test('should connect with Bedrock API key and complete a task', async ({ window }) => {
    if (!config?.secrets || !('apiKey' in config.secrets)) return;
    const secrets = config.secrets as BedrockApiKeySecrets;

    const settingsPage = new SettingsPage(window);
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);

    await settingsPage.navigateToSettings();

    await settingsPage.selectProvider('bedrock');

    await settingsPage.selectBedrockApiKeyTab();

    await settingsPage.enterBedrockApiKey(secrets.apiKey);

    if (secrets.region) {
      await settingsPage.selectBedrockRegion(secrets.region);
    }

    await settingsPage.clickConnect();

    await settingsPage.waitForConnection();

    await settingsPage.selectFirstModel();

    await settingsPage.closeDialog();

    await homePage.enterTask('What is 2 + 2? Reply with just the number.');
    await homePage.submitTask();

    await executionPage.waitForComplete(config.timeout || 180000);

    const badgeText = await executionPage.statusBadge.textContent();
    expect(badgeText?.toLowerCase()).toContain('completed');
  });
});
