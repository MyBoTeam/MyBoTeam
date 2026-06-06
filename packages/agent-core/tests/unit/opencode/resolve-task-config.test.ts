import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBuildProviderConfigs = vi.hoisted(() => vi.fn());
const mockGetFormattedKnowledgeNotes = vi.hoisted(() => vi.fn());
const mockIsTokenExpired = vi.hoisted(() => vi.fn());
const mockRefreshAccessToken = vi.hoisted(() => vi.fn());
const mockPrepareGwsManifest = vi.hoisted(() => vi.fn());

vi.mock('../../../src/opencode/config-builder.js', () => ({
  buildProviderConfigs: mockBuildProviderConfigs,
}));

vi.mock('../../../src/storage/repositories/knowledgeNotes.js', () => ({
  getFormattedKnowledgeNotes: mockGetFormattedKnowledgeNotes,
}));

vi.mock('../../../src/connectors/oauth-tokens.js', () => ({
  isTokenExpired: mockIsTokenExpired,
  refreshAccessToken: mockRefreshAccessToken,
}));

vi.mock('../../../src/google-accounts/index.js', () => ({
  prepareGwsManifest: mockPrepareGwsManifest,
}));

import { resolveTaskConfig } from '../../../src/opencode/resolve-task-config.js';

function createMockStorage() {
  return {
    getEnabledConnectors: vi.fn().mockReturnValue([]),
    getConnectorTokens: vi.fn(),
    setConnectorStatus: vi.fn(),
    storeConnectorTokens: vi.fn(),
    getCloudBrowserConfig: vi.fn().mockReturnValue(undefined),
    getLanguage: vi.fn().mockReturnValue(undefined),
    getApiKey: vi.fn().mockReturnValue(null),
  };
}

function freshProviderResult() {
  return {
    providerConfigs: [{ id: 'anthropic', options: { apiKey: 'sk-test' } }],
    enabledProviders: ['anthropic', 'openai'],
    modelOverride: undefined,
  };
}

beforeEach(() => {
  mockBuildProviderConfigs.mockImplementation(() => Promise.resolve(freshProviderResult()));
  mockGetFormattedKnowledgeNotes.mockReturnValue({ instructions: undefined, context: undefined });
  mockPrepareGwsManifest.mockClear();
  mockRefreshAccessToken.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveTaskConfig', () => {
  it('resolves config with minimal options', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.platform).toBe('darwin');
    expect(result.configOptions.providerConfigs).toHaveLength(1);
    expect(result.configOptions.connectors).toBeUndefined();
    expect(result.configOptions.browser).toBeUndefined();
  });

  it('injects store:false for OpenAI when openai key exists', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'linux',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: (provider: string) => (provider === 'openai' ? 'sk-openai' : null),
    });

    const openaiConfig = result.configOptions.providerConfigs.find(
      (p: { id: string }) => p.id === 'openai',
    );
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig!.options.store).toBe(false);
  });

  it('injects store:false for OpenAI when no existing openai config', async () => {
    mockBuildProviderConfigs.mockResolvedValue({
      providerConfigs: [{ id: 'anthropic', options: { apiKey: 'sk-test' } }],
      enabledProviders: ['anthropic'],
      modelOverride: undefined,
    });

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'linux',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: (provider: string) => (provider === 'openai' ? 'sk-openai' : null),
    });

    const openaiConfig = result.configOptions.providerConfigs.find(
      (p: { id: string }) => p.id === 'openai',
    );
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig!.options.store).toBe(false);
  });

  it('passes model override', async () => {
    mockBuildProviderConfigs.mockResolvedValue({
      providerConfigs: [],
      enabledProviders: [],
      modelOverride: { model: 'claude-4', smallModel: 'claude-haiku-4' },
    });

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.model).toBe('claude-4');
    expect(result.configOptions.smallModel).toBe('claude-haiku-4');
  });

  it('resolves cloud browser config', async () => {
    const storage = createMockStorage();
    storage.getCloudBrowserConfig.mockReturnValue({
      activeProvider: 'browserbase',
      providers: {
        browserbase: { endpoint: 'wss://browser.example.com', apiKey: 'bb-key' },
      },
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.browser).toBeDefined();
    expect(result.configOptions.browser!.mode).toBe('remote');
    expect(result.configOptions.browser!.cdpEndpoint).toBe('wss://browser.example.com');
    expect(result.configOptions.browser!.cdpHeaders).toEqual({
      'X-CDP-Secret': 'bb-key',
    });
  });

  it('does not inject store:false when no openai key', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'linux',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    const openaiConfig = result.configOptions.providerConfigs.find(
      (p: { id: string }) => p.id === 'openai',
    );
    expect(openaiConfig).toBeUndefined();
  });

  it('injects store:false for OpenAI when config already has openai', async () => {
    mockBuildProviderConfigs.mockResolvedValue({
      providerConfigs: [{ id: 'openai', options: { apiKey: 'sk-openai' } }],
      enabledProviders: ['openai'],
      modelOverride: undefined,
    });

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'linux',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: (_provider: string) => 'sk-openai',
    });

    const openaiConfig = result.configOptions.providerConfigs.find(
      (p: { id: string }) => p.id === 'openai',
    );
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig!.options.store).toBe(false);
    expect(openaiConfig!.options.apiKey).toBe('sk-openai');
  });

  it('resolves cloud browser config without api key', async () => {
    const storage = createMockStorage();
    storage.getCloudBrowserConfig.mockReturnValue({
      activeProvider: 'browserbase',
      providers: {
        browserbase: { endpoint: 'wss://browser.example.com' },
      },
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.browser).toBeDefined();
    expect(result.configOptions.browser!.cdpHeaders).toBeUndefined();
  });

  it('skips cloud browser when active provider has no endpoint', async () => {
    const storage = createMockStorage();
    storage.getCloudBrowserConfig.mockReturnValue({
      activeProvider: 'browserbase',
      providers: {
        browserbase: {},
      },
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.browser).toBeUndefined();
  });

  it('skips cloud browser when no active provider', async () => {
    const storage = createMockStorage();
    storage.getCloudBrowserConfig.mockReturnValue({
      activeProvider: null,
      providers: {},
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.browser).toBeUndefined();
  });

  it('resolves connectors with token refresh', async () => {
    const storage = createMockStorage();
    storage.getEnabledConnectors.mockReturnValue([
      {
        id: 'slack-1',
        name: 'Slack',
        url: 'https://slack.com',
        status: 'connected',
        oauthMetadata: { tokenEndpoint: 'https://slack.com/oauth/token' },
        clientRegistration: { clientId: 'slack-client', clientSecret: 'slack-secret' },
      },
    ]);
    storage.getConnectorTokens.mockReturnValue({
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 10000,
    });
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshAccessToken.mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(mockRefreshAccessToken).toHaveBeenCalled();
    expect(storage.storeConnectorTokens).toHaveBeenCalled();
    expect(result.configOptions.connectors).toHaveLength(1);
    expect(result.configOptions.connectors![0]!.accessToken).toBe('new-token');
  });

  it('handles token refresh failure gracefully', async () => {
    const storage = createMockStorage();
    storage.getEnabledConnectors.mockReturnValue([
      {
        id: 'slack-1',
        name: 'Slack',
        url: 'https://slack.com',
        status: 'connected',
        oauthMetadata: { tokenEndpoint: 'https://slack.com/oauth/token' },
        clientRegistration: { clientId: 'slack-client', clientSecret: 'slack-secret' },
      },
    ]);
    storage.getConnectorTokens.mockReturnValue({
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 10000,
    });
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshAccessToken.mockRejectedValue(new Error('Network error'));

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(storage.setConnectorStatus).toHaveBeenCalledWith('slack-1', 'error');
    expect(result.configOptions.connectors).toBeUndefined();
  });

  it('handles expired connector with no refresh token', async () => {
    const storage = createMockStorage();
    storage.getEnabledConnectors.mockReturnValue([
      {
        id: 'slack-1',
        name: 'Slack',
        url: 'https://slack.com',
        status: 'connected',
        oauthMetadata: { tokenEndpoint: 'https://slack.com/oauth/token' },
        clientRegistration: { clientId: 'slack-client', clientSecret: 'slack-secret' },
      },
    ]);
    storage.getConnectorTokens.mockReturnValue({
      accessToken: 'old-token',
      expiresAt: Date.now() - 10000,
    });
    mockIsTokenExpired.mockReturnValue(true);

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(storage.setConnectorStatus).toHaveBeenCalledWith('slack-1', 'error');
    expect(result.configOptions.connectors).toBeUndefined();
  });

  it('marks connector error on missing tokens', async () => {
    const storage = createMockStorage();
    storage.getEnabledConnectors.mockReturnValue([
      {
        id: 'slack-1',
        name: 'Slack',
        url: 'https://slack.com',
        status: 'connected',
      },
    ]);
    storage.getConnectorTokens.mockReturnValue(null);

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(storage.setConnectorStatus).toHaveBeenCalledWith('slack-1', 'error');
    expect(result.configOptions.connectors).toBeUndefined();
  });

  it('skips disconnected connectors', async () => {
    const storage = createMockStorage();
    storage.getEnabledConnectors.mockReturnValue([
      {
        id: 'slack-1',
        name: 'Slack',
        url: 'https://slack.com',
        status: 'disconnected',
      },
    ]);

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.connectors).toBeUndefined();
  });

  it('loads workspace knowledge notes', async () => {
    mockGetFormattedKnowledgeNotes.mockReturnValue({
      instructions: 'Always use TypeScript',
      context: 'This is a TypeScript project',
    });

    const storage = createMockStorage();
    storage.getLanguage.mockReturnValue('en');
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      workspaceId: 'ws-1',
      getApiKey: () => null,
    });

    expect(result.configOptions.knowledgeInstructions).toBe('Always use TypeScript');
    expect(result.configOptions.knowledgeContext).toBe('This is a TypeScript project');
    expect(result.configOptions.language).toBe('en');
  });

  it('handles knowledge notes loading error gracefully', async () => {
    mockGetFormattedKnowledgeNotes.mockImplementation(() => {
      throw new Error('DB error');
    });

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      workspaceId: 'ws-1',
      getApiKey: () => null,
    });

    expect(result.configOptions.knowledgeInstructions).toBeUndefined();
    expect(result.configOptions.knowledgeContext).toBeUndefined();
  });

  it('resolves language from storage', async () => {
    const storage = createMockStorage();
    storage.getLanguage.mockReturnValue('he');

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.language).toBe('he');
  });

  it('passes whatsappApiPort when provided', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      whatsappApiPort: 9090,
      getApiKey: () => null,
    });

    expect(result.configOptions.whatsappApiPort).toBe(9090);
  });

  it('passes auth token when provided', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      authToken: 'daemon-auth-token',
      getApiKey: () => null,
    });

    expect(result.configOptions.authToken).toBe('daemon-auth-token');
  });

  it('passes skills when provided', async () => {
    const storage = createMockStorage();
    const skills = [{ name: 'test-skill', version: '1.0', config: {} }];
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      skills: skills as never,
      getApiKey: () => null,
    });

    expect(result.configOptions.skills).toBe(skills);
  });

  it('handles GWS manifest when database is provided', async () => {
    mockPrepareGwsManifest.mockResolvedValue({
      manifestPath: '/data/gws-manifest.json',
      summary: [{ label: 'Work', email: 'work@example.com', status: 'connected' }],
    });

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
      database: {} as never,
    });

    expect(result.configOptions.gwsAccountsManifestPath).toBe('/data/gws-manifest.json');
    expect(result.configOptions.gwsAccountsSummary).toHaveLength(1);
  });

  it('skips GWS manifest when database is not provided', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.gwsAccountsManifestPath).toBeUndefined();
  });

  it('handles GWS manifest failure gracefully', async () => {
    mockPrepareGwsManifest.mockRejectedValue(new Error('GWS error'));

    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
      database: {} as never,
    });

    expect(result.configOptions.gwsAccountsManifestPath).toBeUndefined();
  });

  it('handles language retrieval error gracefully', async () => {
    const storage = createMockStorage();
    storage.getLanguage.mockImplementation(() => {
      throw new Error('column not found');
    });

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.language).toBeUndefined();
  });

  it('converts empty language string to undefined', async () => {
    const storage = createMockStorage();
    storage.getLanguage.mockReturnValue('   ');

    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      getApiKey: () => null,
    });

    expect(result.configOptions.language).toBeUndefined();
  });

  it('passes configFileName when provided', async () => {
    const storage = createMockStorage();
    const result = await resolveTaskConfig({
      storage: storage as never,
      platform: 'darwin',
      mcpToolsPath: '/tools',
      userDataPath: '/data',
      isPackaged: false,
      configFileName: 'opencode-task-123.json',
      getApiKey: () => null,
    });

    expect(result.configOptions.configFileName).toBe('opencode-task-123.json');
  });
});
