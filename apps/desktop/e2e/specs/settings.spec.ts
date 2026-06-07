import { TEST_SCENARIOS, TEST_TIMEOUTS } from '../config';
import { expect, test } from '../fixtures';
import { ExecutionPage, HomePage, SettingsPage } from '../pages';
import { captureForAI } from '../utils';

test.describe('Settings Dialog', () => {
  test('should open settings dialog when clicking settings button', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');

    await settingsPage.navigateToSettings();

    await captureForAI(window, 'settings-dialog', 'dialog-open', [
      'Settings dialog is visible',
      'Dialog contains provider grid',
      'User can interact with settings',
    ]);

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
  });

  test('should display provider grid with cards', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'provider-grid', [
      'Provider grid is visible',
      'Provider cards are displayed',
      'User can select a provider',
    ]);
  });

  test('should use 4-column grid layout without horizontal scroll', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    const settingsDialog = window.getByTestId('settings-dialog');

    const providerGrid = settingsPage.providerGrid;

    const dialogOverflowX = await settingsDialog.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX;
    });

    expect(['auto', 'hidden', 'visible']).toContain(dialogOverflowX);

    const gridContainer = providerGrid.locator('.grid.grid-cols-4').first();
    await expect(gridContainer).toBeVisible();

    await expect(settingsPage.getProviderCard('anthropic')).toBeVisible();
    await expect(settingsPage.getProviderCard('openai')).toBeVisible();
    await expect(settingsPage.getProviderCard('google')).toBeVisible();
    await expect(settingsPage.getProviderCard('bedrock')).toBeVisible();

    await expect(settingsPage.getProviderCard('moonshot')).not.toBeVisible();

    await captureForAI(window, 'settings-dialog', 'grid-layout', [
      'Settings dialog uses 4-column grid layout',
      'First 4 providers visible in collapsed view',
      'No horizontal scroll needed',
    ]);
  });

  test('should display API key input when selecting a classic provider', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.selectProvider('anthropic');

    await settingsPage.apiKeyInput.scrollIntoViewIfNeeded();

    await expect(settingsPage.apiKeyInput).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'api-key-section', [
      'API key input is visible',
      'User can enter an API key',
      'Input is accessible',
    ]);
  });

  test('should allow typing in API key input', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.selectProvider('anthropic');

    await settingsPage.apiKeyInput.scrollIntoViewIfNeeded();

    const testKey = 'sk-ant-test-key-12345';
    await settingsPage.apiKeyInput.fill(testKey);

    await expect(settingsPage.apiKeyInput).toHaveValue(testKey);

    await captureForAI(window, 'settings-dialog', 'api-key-filled', [
      'API key input has value',
      'Input accepts text entry',
      'Value is correctly displayed',
    ]);
  });

  test('should display debug mode toggle', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();
    await settingsPage.navigateToGeneralTab();

    await settingsPage.debugModeToggle.scrollIntoViewIfNeeded();

    await expect(settingsPage.debugModeToggle).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'debug-section', [
      'Debug mode toggle is visible',
      'Toggle is clickable',
      'Developer settings are accessible',
    ]);
  });

  test('should allow toggling debug mode', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();
    await settingsPage.navigateToGeneralTab();

    await settingsPage.debugModeToggle.scrollIntoViewIfNeeded();

    await captureForAI(window, 'settings-dialog', 'debug-before-toggle', [
      'Debug toggle in initial state',
      'Toggle is ready to click',
    ]);

    await settingsPage.toggleDebugMode();

    await captureForAI(window, 'settings-dialog', 'debug-after-toggle', [
      'Debug toggle state changed',
      'UI reflects new state',
    ]);
  });

  test('should close dialog when pressing Escape', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await window.keyboard.press('Escape');

    const closeAnywayVisible = await settingsPage.closeAnywayButton.isVisible().catch(() => false);
    if (closeAnywayVisible) {
      await settingsPage.closeAnywayButton.click();
    }

    await expect(settingsPage.providerGrid).not.toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'dialog-closed', [
      'Dialog is closed',
      'Main app is visible again',
      'Settings are no longer shown',
    ]);
  });

  test('should display DeepSeek provider card', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const deepseekCard = settingsPage.getProviderCard('deepseek');
    await expect(deepseekCard).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'deepseek-provider-visible', [
      'DeepSeek provider card is visible in settings',
      'Provider card can be clicked',
      'User can select DeepSeek as their provider',
    ]);
  });

  test('should allow selecting DeepSeek provider and entering API key', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('deepseek');

    const testKey = 'sk-deepseek-test-key-12345';
    await settingsPage.apiKeyInput.fill(testKey);

    await expect(settingsPage.apiKeyInput).toHaveValue(testKey);

    await captureForAI(window, 'settings-dialog', 'deepseek-api-key-filled', [
      'DeepSeek provider is selected',
      'API key input accepts DeepSeek key format',
      'Value is correctly displayed',
    ]);
  });

  test('should display Z.AI provider card', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const zaiCard = settingsPage.getProviderCard('zai');
    await expect(zaiCard).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'zai-provider-visible', [
      'Z.AI provider card is visible in settings',
      'Provider card can be clicked',
      'User can select Z.AI as their provider',
    ]);
  });

  test('should allow selecting Z.AI provider and entering API key', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('zai');

    const testKey = 'zai-test-api-key-67890';
    await settingsPage.apiKeyInput.fill(testKey);

    await expect(settingsPage.apiKeyInput).toHaveValue(testKey);

    await captureForAI(window, 'settings-dialog', 'zai-api-key-filled', [
      'Z.AI provider is selected',
      'API key input accepts Z.AI key format',
      'Value is correctly displayed',
    ]);
  });

  test('should display all provider cards when Show All is clicked', async ({ window }) => {
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
      const card = settingsPage.getProviderCard(providerId);
      await expect(card).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
    }

    await captureForAI(window, 'settings-dialog', 'all-providers-visible', [
      'All provider cards are visible',
      'Provider grid shows complete selection',
      'User can select any provider',
    ]);
  });

  test('should display OpenRouter provider card', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const openrouterCard = settingsPage.getProviderCard('openrouter');
    await expect(openrouterCard).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'openrouter-provider-visible', [
      'OpenRouter provider card is visible in settings',
      'Provider card can be clicked',
      'User can select OpenRouter as their provider',
    ]);
  });

  test('should allow selecting OpenRouter provider and entering API key', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('openrouter');

    const testKey = 'sk-or-v1-test-key-12345';
    await settingsPage.apiKeyInput.fill(testKey);

    await expect(settingsPage.apiKeyInput).toHaveValue(testKey);

    await captureForAI(window, 'settings-dialog', 'openrouter-api-key-filled', [
      'OpenRouter provider is selected',
      'API key input accepts OpenRouter key format',
      'Value is correctly displayed',
    ]);
  });

  test('should show LiteLLM provider card and settings', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('litellm');

    await expect(settingsPage.litellmServerUrlInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-dialog', 'litellm-settings', [
      'LiteLLM provider is selected',
      'Server URL input is visible',
      'User can configure LiteLLM connection',
    ]);
  });

  test('should show Ollama provider card and settings', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.selectProvider('ollama');

    await expect(settingsPage.ollamaServerUrlInput).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await captureForAI(window, 'settings-dialog', 'ollama-settings', [
      'Ollama provider is selected',
      'Server URL input is visible',
      'User can configure Ollama connection',
    ]);
  });

  test('should filter providers with search', async ({ window }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    await settingsPage.searchProvider('anthropic');

    await expect(settingsPage.getProviderCard('anthropic')).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await expect(settingsPage.getProviderCard('openai')).not.toBeVisible();

    await captureForAI(window, 'settings-dialog', 'provider-search', [
      'Search filters provider cards',
      'Only matching providers visible',
      'Search functionality works',
    ]);

    await settingsPage.clearSearch();

    await expect(settingsPage.getProviderCard('openai')).toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
  });

  test('should open settings dialog after task completes without crashing', async ({ window }) => {
    const homePage = new HomePage(window);
    const executionPage = new ExecutionPage(window);
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    await executionPage.waitForComplete();

    await expect(executionPage.statusBadge).toBeVisible();

    await settingsPage.navigateToSettings();

    await expect(settingsPage.providerGrid).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'settings-dialog', 'after-task-completion', [
      'Settings dialog opened successfully after task completion',
      'No infinite loop or crash occurred',
      'Dialog is fully functional',
    ]);
  });

  test('should only show green background on active ready provider, not on selected provider', async ({
    window,
  }) => {
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');
    await settingsPage.navigateToSettings();

    await settingsPage.toggleShowAll();

    const anthropicCard = settingsPage.getProviderCard('anthropic');
    await expect(anthropicCard).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await expect(anthropicCard).toHaveClass(/bg-provider-bg-hover/);
    await expect(anthropicCard).not.toHaveClass(/bg-provider-bg-active/);

    const zaiCard = settingsPage.getProviderCard('zai');
    await expect(zaiCard).toBeVisible();

    await expect(zaiCard).toHaveClass(/bg-provider-bg-hover/);
    await expect(zaiCard).not.toHaveClass(/bg-provider-bg-active/);

    await settingsPage.selectProvider('zai');

    await expect(zaiCard).toHaveClass(/bg-provider-bg-hover/);
    await expect(zaiCard).not.toHaveClass(/bg-provider-bg-active/);

    await captureForAI(window, 'settings-dialog', 'green-background-bug-test', [
      'Selected but non-ready provider does not have green background',
      'Bug is fixed - isSelected does not trigger green background',
      'Only active+ready providers should have green background',
    ]);
  });

  test('should enable debug mode and show debug panel on execution page', async ({ window }) => {
    const homePage = new HomePage(window);
    const settingsPage = new SettingsPage(window);

    await window.waitForLoadState('domcontentloaded');

    await settingsPage.navigateToSettings();
    await settingsPage.navigateToGeneralTab();
    await expect(settingsPage.debugModeToggle).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    const toggleButton = settingsPage.debugModeToggle;

    const initialBgClass = await toggleButton.getAttribute('class');
    const isInitiallyOff = initialBgClass?.includes('bg-muted');

    if (isInitiallyOff) {
      await settingsPage.toggleDebugMode();
    }

    await expect(toggleButton).toHaveClass(/bg-primary/);

    const warningMessage = window.getByText('Debug mode is enabled');
    await expect(warningMessage).toBeVisible();

    await settingsPage.pressEscapeToClose();

    const closeAnyway = settingsPage.closeAnywayButton;
    if (await closeAnyway.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeAnyway.click();
    }

    await expect(settingsPage.settingsDialog).not.toBeVisible({
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });

    await homePage.enterTask(TEST_SCENARIOS.SUCCESS.keyword);
    await homePage.submitTask();

    await window.waitForURL(/.*#\/execution.*/, { timeout: TEST_TIMEOUTS.NAVIGATION });

    const debugPanel = window.getByTestId('debug-panel');
    await expect(debugPanel).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });

    await captureForAI(window, 'execution-page', 'debug-panel-enabled', [
      'Debug panel is visible at bottom of execution page',
      'Debug mode was successfully enabled in settings',
      'Panel shows Debug Logs header',
    ]);
  });
});
