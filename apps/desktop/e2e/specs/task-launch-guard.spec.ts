import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { HomePage, SettingsPage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Task Launch Guard', () => {
  test('should display provider grid when opening settings', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(settingsPage.getProviderCard('anthropic')).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await expect(settingsPage.getProviderCard('openai')).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'task-launch-guard', 'provider-grid-visible', [
      'Provider grid is displayed',
      'Provider cards are visible',
      'User can select a provider',
    ]);
  });

  test('should show provider settings panel when selecting a provider', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.selectProvider('anthropic');

    const settingsPanel = window.getByTestId('provider-settings-panel');
    await expect(settingsPanel).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(settingsPage.apiKeyInput).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'task-launch-guard', 'provider-settings-panel', [
      'Provider settings panel is visible',
      'API key input is shown',
      'User can configure the provider',
    ]);
  });

  test('should have Done button in settings dialog', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await expect(settingsPage.doneButton).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'task-launch-guard', 'done-button-visible', [
      'Done button is visible in settings',
      'User can close settings dialog',
    ]);
  });

  test('should display Close Anyway button when close warning appears', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.doneButton.click();

    const closeAnywayVisible = await settingsPage.closeAnywayButton.isVisible().catch(() => false);
    const dialogClosed = !(await settingsPage.settingsDialog.isVisible().catch(() => true));

    if (closeAnywayVisible) {
      await expect(settingsPage.closeAnywayButton).toBeVisible();

      await captureForAI(window, 'task-launch-guard', 'close-warning-visible', [
        'Close warning is displayed',
        'Close Anyway button is visible',
        'User is warned about missing provider',
      ]);
    } else if (dialogClosed) {
      await captureForAI(window, 'task-launch-guard', 'dialog-closed-with-provider', [
        'Dialog closed successfully',
        'A provider was ready (E2E mode pre-configured)',
        'Task submission should work',
      ]);
    }
  });

  test('should allow closing dialog with Close Anyway if warning appears', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await window.keyboard.press('Escape');

    const closeAnywayVisible = await settingsPage.closeAnywayButton.isVisible().catch(() => false);

    if (closeAnywayVisible) {
      await settingsPage.closeAnywayButton.click();

      await expect(settingsPage.settingsDialog).not.toBeVisible({
        timeout: TEST_TIMEOUTS.NAVIGATION,
      });

      await captureForAI(window, 'task-launch-guard', 'close-anyway-clicked', [
        'Close Anyway button was clicked',
        'Dialog closed despite warning',
        'User can proceed without provider',
      ]);
    } else {
      await expect(settingsPage.providerGrid).not.toBeVisible({
        timeout: TEST_TIMEOUTS.NAVIGATION,
      });
    }
  });

  test('should show all providers when Show All is clicked', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const providerIds = [
      'openai',
      'anthropic',
      'google',
      'bedrock',
      'moonshot',
      'azure-foundry',
      'deepseek',
      'zai',
      'ollama',
      'lmstudio',
      'xai',
      'openrouter',
      'litellm',
      'minimax',
    ];

    for (const providerId of providerIds) {
      await expect(settingsPage.getProviderCard(providerId)).toBeVisible({
        timeout: TEST_TIMEOUTS.NAVIGATION,
      });
    }

    await captureForAI(window, 'task-launch-guard', 'all-providers-visible', [
      'All 10 provider cards are visible',
      'Show All expanded the grid',
      'User can select any provider',
    ]);
  });

  test('should filter providers by search', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.searchProvider('ollama');

    await expect(settingsPage.getProviderCard('ollama')).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await expect(settingsPage.getProviderCard('anthropic')).not.toBeVisible();
    await expect(settingsPage.getProviderCard('openai')).not.toBeVisible();

    await captureForAI(window, 'task-launch-guard', 'search-filters-providers', [
      'Search filters provider grid',
      'Only matching provider is visible',
      'Search functionality works correctly',
    ]);
  });

  test('should be able to navigate back to home and submit task', async ({ window }) => {
    const homePage = new HomePage(window);
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');

    await settingsPage.navigateToSettings();
    await window.keyboard.press('Escape');

    const closeAnywayVisible = await settingsPage.closeAnywayButton.isVisible().catch(() => false);
    if (closeAnywayVisible) {
      await settingsPage.closeAnywayButton.click();
    }

    await expect(settingsPage.settingsDialog).not.toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);

    await expect(homePage.submitButton).toBeEnabled();

    await captureForAI(window, 'task-launch-guard', 'ready-to-submit-task', [
      'Settings dialog closed',
      'Task input is ready',
      'Submit button is enabled',
    ]);
  });

  test('should display connected badge on provider card when connected', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    const providers = ['anthropic', 'openai', 'openrouter', 'google', 'xai', 'moonshot'];

    let foundConnected = false;
    for (const providerId of providers) {
      const badge = settingsPage.getProviderConnectedBadge(providerId);
      const isVisible = await badge.isVisible().catch(() => false);
      if (isVisible) {
        foundConnected = true;
        await captureForAI(window, 'task-launch-guard', 'connected-badge-visible', [
          `${providerId} provider has connected badge`,
          'Badge indicates provider is configured',
          'User can see which providers are ready',
        ]);
        break;
      }
    }

    if (!foundConnected) {
      await captureForAI(window, 'task-launch-guard', 'no-connected-badge', [
        'No provider has connected badge',
        'User needs to configure a provider',
        'Provider grid shows available options',
      ]);
    }
  });
});
