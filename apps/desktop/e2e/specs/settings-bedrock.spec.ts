import { TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Settings - Amazon Bedrock', () => {
  test('should display Bedrock provider card', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const bedrockCard = settingsPage.getProviderCard('bedrock');
    await expect(bedrockCard).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-bedrock', 'provider-card-visible', [
      'Bedrock provider card is visible',
      'User can select Bedrock',
    ]);
  });

  test('should show Bedrock credential form when selected', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await expect(settingsPage.bedrockApiKeyTab).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
    await expect(settingsPage.bedrockAccessKeyTab).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.bedrockAwsProfileTab).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'credential-form-visible', [
      'Bedrock credential form is visible',
      'All three auth tabs are shown',
    ]);
  });

  test('should have API Key tab selected by default', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    const apiKeyTab = settingsPage.bedrockApiKeyTab;
    await expect(apiKeyTab).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(apiKeyTab).toHaveClass(/bg-provider-accent/);

    await expect(settingsPage.bedrockApiKeyInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'api-key-tab-default', [
      'API Key tab is selected by default',
      'API Key input is visible',
    ]);
  });

  test('should switch between all three auth tabs', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await expect(settingsPage.bedrockApiKeyInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.bedrockAccessKeyIdInput).not.toBeVisible();
    await expect(settingsPage.bedrockProfileNameInput).not.toBeVisible();

    await settingsPage.selectBedrockAccessKeyTab();
    await expect(settingsPage.bedrockAccessKeyIdInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.bedrockSecretKeyInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.bedrockApiKeyInput).not.toBeVisible();

    await settingsPage.selectBedrockAwsProfileTab();
    await expect(settingsPage.bedrockProfileNameInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.bedrockAccessKeyIdInput).not.toBeVisible();

    await settingsPage.selectBedrockApiKeyTab();
    await expect(settingsPage.bedrockApiKeyInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'tab-switching', [
      'Can switch between all three auth tabs',
      'Form fields update correctly',
    ]);
  });

  test('should allow typing in Bedrock API key field', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    const testApiKey = 'br-test-api-key-12345';

    await settingsPage.bedrockApiKeyInput.fill(testApiKey);

    await expect(settingsPage.bedrockApiKeyInput).toHaveValue(testApiKey);

    await expect(settingsPage.bedrockRegionSelect).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'api-key-field-filled', [
      'API key field accepts input',
      'Region selector is available',
    ]);
  });

  test('should allow typing in Bedrock access key fields', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await settingsPage.selectBedrockAccessKeyTab();

    const testAccessKey = 'AKIAIOSFODNN7EXAMPLE';
    const testSecretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

    await settingsPage.bedrockAccessKeyIdInput.fill(testAccessKey);
    await settingsPage.bedrockSecretKeyInput.fill(testSecretKey);

    await expect(settingsPage.bedrockAccessKeyIdInput).toHaveValue(testAccessKey);
    await expect(settingsPage.bedrockSecretKeyInput).toHaveValue(testSecretKey);

    await expect(settingsPage.bedrockRegionSelect).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'access-key-fields-filled', [
      'Access key fields accept input',
      'Region selector is available',
    ]);
  });

  test('should allow typing in Bedrock profile fields', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await settingsPage.selectBedrockAwsProfileTab();

    const testProfile = 'my-aws-profile';

    await settingsPage.bedrockProfileNameInput.clear();
    await settingsPage.bedrockProfileNameInput.fill(testProfile);

    await expect(settingsPage.bedrockProfileNameInput).toHaveValue(testProfile);

    await expect(settingsPage.bedrockRegionSelect).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'profile-fields-filled', [
      'Profile field accepts input',
      'Region selector is available',
    ]);
  });

  test('should have Connect button for Bedrock credentials', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await expect(settingsPage.connectButton).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-bedrock', 'connect-button-visible', [
      'Connect button is visible',
      'User can connect to Bedrock',
    ]);
  });

  test('should display region selector for Bedrock', async ({ window }) => {
    const settingsPage = new SettingsPage(window);
    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('bedrock');

    await expect(settingsPage.bedrockRegionSelect).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-bedrock', 'region-selector-visible', [
      'Region selector is visible',
      'User can select AWS region',
    ]);
  });
});
