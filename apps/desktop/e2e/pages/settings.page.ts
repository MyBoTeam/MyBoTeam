import type { Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../config';

export class SettingsPage {
  constructor(private page: Page) {}

  get providerGrid() {
    return this.page.getByTestId('provider-grid');
  }

  get providerSearchInput() {
    return this.page.getByTestId('provider-search-input');
  }

  get showAllButton() {
    return this.page.getByRole('button', { name: 'Show All' });
  }

  get hideButton() {
    return this.page.getByRole('button', { name: 'Hide' });
  }

  getProviderCard(providerId: string) {
    return this.page.getByTestId(`provider-card-${providerId}`);
  }

  getProviderConnectedBadge(providerId: string) {
    return this.page.getByTestId(`provider-connected-badge-${providerId}`);
  }

  get connectionStatus() {
    return this.page.getByTestId('connection-status');
  }

  get disconnectButton() {
    return this.page.getByTestId('disconnect-button');
  }

  get connectButton() {
    return this.page.getByRole('button', { name: 'Connect', exact: true });
  }

  get modelSelector() {
    return this.page.getByTestId('model-selector');
  }

  get modelSelectorError() {
    return this.page.getByTestId('model-selector-error');
  }

  get apiKeyInput() {
    return this.page.getByTestId('api-key-input');
  }

  get apiKeyHelpLink() {
    return this.page.getByRole('link', { name: 'How can I find it?' });
  }

  get bedrockApiKeyTab() {
    return this.page.getByTestId('bedrock-auth-tab-apikey');
  }

  get bedrockAccessKeyTab() {
    return this.page.getByTestId('bedrock-auth-tab-accesskey');
  }

  get bedrockAwsProfileTab() {
    return this.page.getByTestId('bedrock-auth-tab-profile');
  }

  get bedrockApiKeyInput() {
    return this.page.getByTestId('bedrock-api-key-input');
  }

  get bedrockAccessKeyIdInput() {
    return this.page.getByTestId('bedrock-access-key-id');
  }

  get bedrockSecretKeyInput() {
    return this.page.getByTestId('bedrock-secret-key');
  }

  get bedrockSessionTokenInput() {
    return this.page.getByTestId('bedrock-session-token');
  }

  get bedrockProfileNameInput() {
    return this.page.getByTestId('bedrock-profile-name');
  }

  get bedrockRegionSelect() {
    return this.page.getByTestId('bedrock-region-select');
  }

  get ollamaServerUrlInput() {
    return this.page.getByTestId('ollama-server-url');
  }

  get ollamaConnectionError() {
    return this.page.getByTestId('ollama-connection-error');
  }

  get litellmServerUrlInput() {
    return this.page.getByTestId('litellm-server-url');
  }

  get litellmApiKeyInput() {
    return this.page.getByTestId('litellm-api-key');
  }

  get openrouterFetchModelsButton() {
    return this.page.getByRole('button', { name: /Fetch Models|Refresh/ });
  }

  get debugModeToggle() {
    return this.page.getByTestId('settings-debug-toggle');
  }

  get settingsDialog() {
    return this.page.getByTestId('settings-dialog');
  }

  get doneButton() {
    return this.page.getByTestId('settings-done-button');
  }

  get closeWarning() {
    return this.page.getByText('No provider ready');
  }

  get closeAnywayButton() {
    return this.page.getByRole('button', { name: 'Close Anyway' });
  }

  get sidebarSettingsButton() {
    return this.page.getByTestId('sidebar-settings-button');
  }

  async navigateToSettings() {
    await this.sidebarSettingsButton.click();
    await this.settingsDialog.waitFor({ state: 'visible', timeout: TEST_TIMEOUTS.NAVIGATION });
  }

  async navigateToGeneralTab() {
    await this.page.getByRole('button', { name: 'General' }).click();
  }

  async selectProvider(providerId: string) {
    await this.getProviderCard(providerId).click();

    await this.connectButton.or(this.connectionStatus).waitFor({ state: 'visible', timeout: 5000 });
  }

  async searchProvider(query: string) {
    await this.providerSearchInput.fill(query);
  }

  async clearSearch() {
    await this.providerSearchInput.clear();
  }

  async toggleShowAll() {
    const showAllVisible = await this.showAllButton.isVisible();
    if (showAllVisible) {
      await this.showAllButton.click();
    } else {
      await this.hideButton.click();
    }
  }

  async enterApiKey(key: string) {
    await this.apiKeyInput.fill(key);
  }

  async clickConnect() {
    await this.connectButton.click();
  }

  async waitForConnection(timeout = 30000) {
    await this.page
      .locator('[data-testid="connection-status"][data-status="connected"]')
      .waitFor({ state: 'visible', timeout });
  }

  async clickDisconnect() {
    await this.disconnectButton.click();
  }

  async selectModel(modelId: string) {
    const tagName = await this.modelSelector.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await this.modelSelector.selectOption(modelId);
    } else {
      await this.modelSelector.click();
      const option = this.page.locator(`[data-model-id="${modelId}"]`);
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    }
  }

  async selectFirstModel() {
    const tagName = await this.modelSelector.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await this.modelSelector.evaluate((el) => {
        const select = el as HTMLSelectElement;
        if (select.options.length > 1) {
          select.selectedIndex = 1;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    } else {
      await this.modelSelector.click();
      const firstOption = this.page.locator('[data-model-id]').first();
      await firstOption.waitFor({ state: 'visible', timeout: 5000 });
      await firstOption.click();
    }
  }

  async toggleDebugMode() {
    await this.debugModeToggle.click();
  }

  async closeDialog() {
    await this.doneButton.click();
    await this.settingsDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async pressEscapeToClose() {
    await this.page.keyboard.press('Escape');
  }

  async selectBedrockApiKeyTab() {
    await this.bedrockApiKeyTab.click();
  }

  async selectBedrockAccessKeyTab() {
    await this.bedrockAccessKeyTab.click();
  }

  async selectBedrockAwsProfileTab() {
    await this.bedrockAwsProfileTab.click();
  }

  async enterBedrockApiKey(apiKey: string) {
    await this.bedrockApiKeyInput.fill(apiKey);
  }

  async enterBedrockAccessKeyCredentials(
    accessKeyId: string,
    secretKey: string,
    sessionToken?: string,
  ) {
    await this.bedrockAccessKeyIdInput.fill(accessKeyId);
    await this.bedrockSecretKeyInput.fill(secretKey);
    if (sessionToken) {
      await this.bedrockSessionTokenInput.fill(sessionToken);
    }
  }

  async enterBedrockProfileCredentials(profileName: string) {
    await this.bedrockProfileNameInput.fill(profileName);
  }

  async selectBedrockRegion(region: string) {
    await this.bedrockRegionSelect.selectOption(region);
  }

  async enterOllamaServerUrl(url: string) {
    await this.ollamaServerUrlInput.fill(url);
  }

  async enterLiteLLMServerUrl(url: string) {
    await this.litellmServerUrlInput.fill(url);
  }

  async enterLiteLLMApiKey(key: string) {
    await this.litellmApiKeyInput.fill(key);
  }
}
