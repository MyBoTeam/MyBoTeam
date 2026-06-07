/**
 * Unit tests for IPC handlers
 *
 * Tests the registration and invocation of IPC handlers for:
 * - Task operations (start, cancel, interrupt, get, list, delete, clear)
 * - API key management (get, set, validate, delete)
 * - Settings (debug mode, app settings, model selection)
 * - Onboarding
 * - Permission responses
 * - Session management
 *
 * NOTE: This is a UNIT test, not an integration test.
 * All dependent modules (taskHistory, secureStorage, appSettings, task-manager, adapter)
 * are mocked to test handler logic in isolation. This follows the principle that
 * unit tests should test a single unit with all dependencies mocked.
 *
 * For true integration testing, see the integration tests that use real
 * implementations with temp directories.
 *
 * @module __tests__/unit/main/ipc/handlers.unit.test
 */

import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

vi.mock('electron', () => {
  const mockHandlers = new Map<string, (...args: unknown[]) => unknown>();
  const mockListeners = new Map<string, Set<(...args: unknown[]) => unknown>>();

  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        mockHandlers.set(channel, handler);
      }),
      on: vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => {
        if (!mockListeners.has(channel)) {
          mockListeners.set(channel, new Set());
        }
        mockListeners.get(channel)!.add(listener);
      }),
      removeHandler: vi.fn((channel: string) => {
        mockHandlers.delete(channel);
      }),
      removeAllListeners: vi.fn((channel?: string) => {
        if (channel) {
          mockListeners.delete(channel);
        } else {
          mockListeners.clear();
        }
      }),

      _getHandler: (channel: string) => mockHandlers.get(channel),
      _getHandlers: () => mockHandlers,
      _clear: () => {
        mockHandlers.clear();
        mockListeners.clear();
      },
    },
    BrowserWindow: {
      fromWebContents: vi.fn(() => ({
        id: 1,
        isDestroyed: vi.fn(() => false),
        webContents: {
          send: vi.fn(),
          isDestroyed: vi.fn(() => false),
          capturePage: vi.fn(() =>
            Promise.resolve({
              toPNG: () => Buffer.from('fake-png-data'),
              getSize: () => ({ width: 1920, height: 1080 }),
            }),
          ),
          executeJavaScript: vi.fn(() => Promise.resolve('{"tag":"body","children":[]}')),
        },
      })),
      getFocusedWindow: vi.fn(() => ({
        id: 1,
        isDestroyed: vi.fn(() => false),
      })),
      getAllWindows: vi.fn(() => [{ id: 1, webContents: { send: vi.fn() } }]),
    },
    dialog: {
      showSaveDialog: vi.fn(() =>
        Promise.resolve({ canceled: false, filePath: '/tmp/bug-report.json' }),
      ),
      showOpenDialog: vi.fn(() => Promise.resolve({ canceled: false, filePaths: [] })),
    },
    nativeTheme: {
      themeSource: 'system',
      shouldUseDarkColors: false,
    },
    shell: {
      openExternal: vi.fn(),
    },
    app: {
      isPackaged: false,
      getPath: vi.fn(() => '/tmp/test-app'),
      getVersion: vi.fn(() => '1.0.0-test'),
    },
  };
});

const mockTaskManager = {
  startTask: vi.fn(),
  cancelTask: vi.fn(),
  interruptTask: vi.fn(),
  sendResponse: vi.fn(),
  hasActiveTask: vi.fn(() => false),
  getActiveTaskId: vi.fn(() => null),
  getSessionId: vi.fn(() => null),
  isTaskQueued: vi.fn(() => false),
  cancelQueuedTask: vi.fn(),
  dispose: vi.fn(),
};

vi.mock('@main/opencode', () => ({
  getTaskManager: vi.fn(() => mockTaskManager),
  disposeTaskManager: vi.fn(),
  isOpenCodeCliInstalled: vi.fn(() => Promise.resolve(true)),
  getOpenCodeCliVersion: vi.fn(() => Promise.resolve('1.0.0')),
}));

const mockDaemonClient = {
  call: vi.fn(async (method: string, params?: unknown) => {
    if (method === 'task.start') {
      const p = params as { prompt: string; taskId?: string };
      return {
        id: p?.taskId || 'tsk_daemon_test',
        prompt: p?.prompt || 'test',
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
      };
    }
    if (method === 'session.resume') {
      const p = params as { prompt: string; existingTaskId?: string };
      return {
        id: p?.existingTaskId || 'tsk_daemon_resume',
        prompt: p?.prompt || 'test',
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
      };
    }
    if (method === 'task.get') {
      const p = params as { taskId: string };
      return mockTasks.find((t) => t.id === p.taskId) || null;
    }
    if (method === 'task.list') {
      return mockTasks;
    }
    if (method === 'task.getTodos') {
      return [];
    }

    if (method === 'auth.openai.status') {
      return { connected: false };
    }
    if (method === 'auth.openai.getAccessToken') {
      return null;
    }

    if (method === 'settings.getAll') {
      return {
        app: {
          debugMode: mockDebugMode,
          onboardingComplete: mockOnboardingComplete,
          selectedModel: mockSelectedModel,
          openaiBaseUrl: mockOpenAiBaseUrl,
        },
        providers: {
          activeProviderId: 'anthropic',
          connectedProviders: {
            anthropic: {
              providerId: 'anthropic',
              connectionStatus: 'connected',
              selectedModelId: 'claude-3-5-sonnet-20241022',
              credentials: { type: 'api-key', apiKey: 'test-key' },
            },
          },
          debugMode: false,
        },
        huggingFaceLocalConfig: null,
        notificationsEnabled: true,
        closeBehavior: 'keep-daemon',
        sandboxConfig: {
          mode: 'disabled',
          allowedPaths: [],
          networkRestricted: false,
          allowedHosts: [],
        },
        cloudBrowserConfig: null,
        messagingConfig: null,
        nimConfig: null,
      };
    }
    if (method === 'settings.setTheme') return undefined;
    if (method === 'settings.setLanguage') return undefined;
    if (method === 'settings.setDebugMode') {
      const p = params as { enabled: boolean };
      mockDebugMode = p.enabled;
      return undefined;
    }
    if (method === 'settings.setNotificationsEnabled') return undefined;
    if (method === 'settings.getNotificationsEnabled') return true;
    if (method === 'settings.setCloseBehavior') return undefined;
    if (method === 'settings.getCloseBehavior') return 'keep-daemon';
    if (method === 'settings.setSandboxConfig') return undefined;
    if (method === 'settings.getSandboxConfig') {
      return {
        mode: 'disabled',
        allowedPaths: [],
        networkRestricted: false,
        allowedHosts: [],
      };
    }
    if (method === 'settings.setCloudBrowserConfig') return undefined;
    if (method === 'settings.getCloudBrowserConfig') return null;
    if (method === 'settings.setMessagingConfig') return undefined;
    if (method === 'settings.getMessagingConfig') return null;
    if (method === 'settings.setOnboardingComplete') {
      const p = params as { complete: boolean };
      mockOnboardingComplete = p.complete;
      return undefined;
    }
    if (method === 'settings.getSelectedModel') return mockSelectedModel;
    if (method === 'settings.setSelectedModel') {
      const p = params as { model: { provider: string; model: string } };
      mockSelectedModel = p.model;
      return undefined;
    }
    if (method === 'settings.getOpenAiBaseUrl') return mockOpenAiBaseUrl;
    if (method === 'settings.setOpenAiBaseUrl') {
      const p = params as { baseUrl: string };
      mockOpenAiBaseUrl = p.baseUrl;
      return undefined;
    }

    if (method === 'provider.getSettings') {
      return {
        activeProviderId: 'anthropic',
        connectedProviders: {
          anthropic: {
            providerId: 'anthropic',
            connectionStatus: 'connected',
            selectedModelId: 'claude-3-5-sonnet-20241022',
            credentials: { type: 'api-key', apiKey: 'test-key' },
          },
        },
        debugMode: false,
      };
    }
    if (method === 'provider.setActive') return undefined;
    if (method === 'provider.setConnected') return undefined;
    if (method === 'provider.removeConnected') return undefined;
    if (method === 'provider.updateModel') return undefined;
    if (method === 'provider.setDebugMode') return undefined;
    if (method === 'provider.getDebugMode') return false;
    if (method === 'provider.getHuggingFaceLocalConfig') return null;
    if (method === 'provider.setHuggingFaceLocalConfig') return undefined;

    if (method === 'favorites.list') {
      return [...mockFavorites];
    }
    if (method === 'favorites.add') {
      const p = params as { taskId: string; prompt: string; summary?: string };
      const existing = mockFavorites.findIndex((f) => f.taskId === p.taskId);
      const entry = {
        taskId: p.taskId,
        prompt: p.prompt,
        summary: p.summary,
        favoritedAt: new Date().toISOString(),
      };
      if (existing >= 0) {
        mockFavorites[existing] = entry;
      } else {
        mockFavorites.push(entry);
      }
      return undefined;
    }
    if (method === 'favorites.remove') {
      const p = params as { taskId: string };
      const i = mockFavorites.findIndex((f) => f.taskId === p.taskId);
      if (i >= 0) {
        mockFavorites.splice(i, 1);
      }
      return undefined;
    }
    if (method === 'favorites.isFavorite') {
      const p = params as { taskId: string };
      return mockFavorites.some((f) => f.taskId === p.taskId);
    }

    if (method === 'legacy.importElectronStoreIfNeeded') {
      return { applied: false, reason: 'already-imported' };
    }

    return undefined;
  }),
  ping: vi.fn(async () => ({ status: 'ok' as const, uptime: 1000 })),
  close: vi.fn(),
  onNotification: vi.fn(),
};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
  getDaemonMode: vi.fn(() => 'socket'),
  shutdownDaemon: vi.fn(),
  bootstrapDaemon: vi.fn(),
  registerNotificationForwarding: vi.fn(),
}));

vi.mock('@main/daemon/daemon-connector', () => ({
  ensureDaemonRunning: vi.fn(async () => mockDaemonClient),
  getDataDir: vi.fn(() => '/tmp/test-data'),
  getDaemonEntryPath: vi.fn(() => '/tmp/test-daemon.js'),
  spawnDaemon: vi.fn(),
  tailDaemonLog: vi.fn(),
  stopTailingDaemonLog: vi.fn(),
  isDaemonStopped: vi.fn(() => false),
  suppressReconnect: vi.fn(),
  enableReconnect: vi.fn(),
  onReconnect: vi.fn(() => () => {}),
  setupDisconnectHandler: vi.fn(),
  DaemonRestartError: class DaemonRestartError extends Error {},
}));

const authBrowserMocks = vi.hoisted(() => ({
  loginOpenAiWithChatGpt: vi.fn(() => Promise.resolve({ openedUrl: undefined })),
}));

vi.mock('@main/providers/huggingface-local', () => ({
  startHuggingFaceServer: vi.fn(() => Promise.resolve({ success: true, port: 8080 })),
  stopHuggingFaceServer: vi.fn(() => Promise.resolve()),
  getHuggingFaceServerStatus: vi.fn(() => ({
    running: false,
    port: null,
    loadedModel: null,
    isLoading: false,
  })),
  testHuggingFaceConnection: vi.fn(() =>
    Promise.resolve({ success: false, error: 'Server is not running' }),
  ),
  downloadModel: vi.fn(() => Promise.resolve({ success: true })),
  listCachedModels: vi.fn(() => []),
  deleteModel: vi.fn(() => Promise.resolve({ success: true })),
  SUGGESTED_MODELS: [],
}));

const slackAuthMocks = vi.hoisted(() => ({
  loginSlackMcp: vi.fn(() => Promise.resolve()),
  logoutSlackMcp: vi.fn(() => Promise.resolve()),
}));

vi.mock('@main/opencode/auth-browser', () => authBrowserMocks);
vi.mock('@main/opencode/slack-auth', () => slackAuthMocks);

const mockTasks: Array<{
  id: string;
  prompt: string;
  status: string;
  messages: unknown[];
  createdAt: string;
  summary?: string;
}> = [];

const mockFavorites: Array<{
  taskId: string;
  prompt: string;
  summary?: string;
  favoritedAt: string;
}> = [];

let mockDebugMode = false;
let mockOnboardingComplete = false;
let mockSelectedModel: { provider: string; model: string } | null = null;
let mockOpenAiBaseUrl = '';

vi.mock('@myboteam/agent-core/desktop-main', async () => {
  return await vi.importMock('@myboteam/agent-core');
});

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@myboteam/agent-core')>();

  const storageMethods = {
    getTasks: vi.fn(() => mockTasks),
    getTask: vi.fn((taskId: string) => mockTasks.find((t) => t.id === taskId)),
    saveTask: vi.fn((task: unknown) => {
      const t = task as { id: string };
      const existing = mockTasks.findIndex((x) => x.id === t.id);
      if (existing >= 0) {
        mockTasks[existing] = task as (typeof mockTasks)[0];
      } else {
        mockTasks.push(task as (typeof mockTasks)[0]);
      }
    }),
    updateTaskStatus: vi.fn(),
    updateTaskSessionId: vi.fn(),
    updateTaskSummary: vi.fn(),
    addTaskMessage: vi.fn(),
    deleteTask: vi.fn((taskId: string) => {
      const idx = mockTasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) mockTasks.splice(idx, 1);
    }),
    clearHistory: vi.fn(() => {
      mockTasks.length = 0;
    }),
    saveTodosForTask: vi.fn(),
    getTodosForTask: vi.fn(() => []),
    clearTodosForTask: vi.fn(),
    addFavorite: vi.fn((taskId: string, prompt: string, summary?: string) => {
      const existing = mockFavorites.findIndex((f) => f.taskId === taskId);
      const entry = { taskId, prompt, summary, favoritedAt: new Date().toISOString() };
      if (existing >= 0) {
        mockFavorites[existing] = entry;
      } else {
        mockFavorites.push(entry);
      }
    }),
    removeFavorite: vi.fn((taskId: string) => {
      const i = mockFavorites.findIndex((f) => f.taskId === taskId);
      if (i >= 0) {
        mockFavorites.splice(i, 1);
      }
    }),
    getFavorites: vi.fn(() => [...mockFavorites]),
    isFavorite: vi.fn((taskId: string) => mockFavorites.some((f) => f.taskId === taskId)),

    getNotificationsEnabled: vi.fn(() => true),
    setNotificationsEnabled: vi.fn(),
    getDebugMode: vi.fn(() => mockDebugMode),
    setDebugMode: vi.fn((enabled: boolean) => {
      mockDebugMode = enabled;
    }),
    getAppSettings: vi.fn(() => ({
      debugMode: mockDebugMode,
      onboardingComplete: mockOnboardingComplete,
      selectedModel: mockSelectedModel,
      openaiBaseUrl: mockOpenAiBaseUrl,
    })),
    getOnboardingComplete: vi.fn(() => mockOnboardingComplete),
    setOnboardingComplete: vi.fn((complete: boolean) => {
      mockOnboardingComplete = complete;
    }),
    getSelectedModel: vi.fn(() => mockSelectedModel),
    setSelectedModel: vi.fn((model: { provider: string; model: string }) => {
      mockSelectedModel = model;
    }),
    getOpenAiBaseUrl: vi.fn(() => mockOpenAiBaseUrl),
    setOpenAiBaseUrl: vi.fn((baseUrl: string) => {
      mockOpenAiBaseUrl = baseUrl;
    }),
    getOllamaConfig: vi.fn(() => null),
    setOllamaConfig: vi.fn(),
    getAzureFoundryConfig: vi.fn(() => null),
    setAzureFoundryConfig: vi.fn(),
    getLiteLLMConfig: vi.fn(() => null),
    setLiteLLMConfig: vi.fn(),
    getLMStudioConfig: vi.fn(() => null),
    setLMStudioConfig: vi.fn(),
    clearAppSettings: vi.fn(),

    getProviderSettings: vi.fn(() => ({
      activeProviderId: 'anthropic',
      connectedProviders: {
        anthropic: {
          providerId: 'anthropic',
          connectionStatus: 'connected',
          selectedModelId: 'claude-3-5-sonnet-20241022',
          credentials: { type: 'api-key', apiKey: 'test-key' },
        },
      },
      debugMode: false,
    })),
    setActiveProvider: vi.fn(),
    getActiveProviderModel: vi.fn(() => ({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    })),
    getConnectedProvider: vi.fn(() => ({
      providerId: 'anthropic',
      connectionStatus: 'connected',
      selectedModelId: 'claude-3-5-sonnet-20241022',
      credentials: { type: 'api-key', apiKey: 'test-key' },
    })),
    setConnectedProvider: vi.fn(),
    removeConnectedProvider: vi.fn(),
    updateProviderModel: vi.fn(),
    setProviderDebugMode: vi.fn(),
    getProviderDebugMode: vi.fn(() => false),
    hasReadyProvider: vi.fn(() => true),
    getConnectedProviderIds: vi.fn(() => ['anthropic']),
    getActiveProviderId: vi.fn(() => 'anthropic'),
    clearProviderSettings: vi.fn(),

    initialize: vi.fn(),
    isDatabaseInitialized: vi.fn(() => true),
    close: vi.fn(),
    getDatabasePath: vi.fn(() => '/mock/path'),

    storeApiKey: vi.fn(),
    getApiKey: vi.fn(() => null),
    deleteApiKey: vi.fn(() => true),
    getAllApiKeys: vi.fn(() => Promise.resolve({})),
    storeBedrockCredentials: vi.fn(),
    getBedrockCredentials: vi.fn(() => null),
    hasAnyApiKey: vi.fn(() => Promise.resolve(false)),
    listStoredCredentials: vi.fn(() => []),
    clearSecureStorage: vi.fn(),
  };

  return {
    validateApiKey: actual.validateApiKey,
    validateHttpUrl: actual.validateHttpUrl,
    validateTaskConfig: actual.validateTaskConfig,
    ALLOWED_API_KEY_PROVIDERS: actual.ALLOWED_API_KEY_PROVIDERS,
    STANDARD_VALIDATION_PROVIDERS: actual.STANDARD_VALIDATION_PROVIDERS,
    validate: actual.validate,
    permissionResponseSchema: actual.permissionResponseSchema,

    createTaskId: vi.fn(() => `task_${Date.now()}`),
    createMessageId: vi.fn(() => `msg-${Date.now()}`),
    sanitizeString: vi.fn((input: unknown, fieldName: string, maxLength = 255) => {
      if (typeof input !== 'string') {
        throw new Error(`${fieldName} must be a string`);
      }
      const trimmed = input.trim();
      if (!trimmed) {
        throw new Error(`${fieldName} is required`);
      }
      if (trimmed.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
      }
      return trimmed;
    }),
    safeParseJson: vi.fn((s: string) => ({ success: true, data: JSON.parse(s) })),

    ...storageMethods,

    createStorage: vi.fn(() => storageMethods),

    getOpenAiOauthStatus: vi.fn(() => ({ connected: false })),
    getSlackMcpOauthStatus: vi.fn(() => ({
      connected: false,
      pendingAuthorization: false,
    })),

    getAzureEntraToken: vi.fn(() => Promise.resolve({ success: true, token: 'mock-token' })),

    generateTaskSummary: vi.fn(() => Promise.resolve('Mock task summary')),

    validateAnthropicApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateOpenAIApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateGoogleApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateXAIApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateBedrockCredentials: vi.fn(() => Promise.resolve({ valid: true })),
    validateDeepSeekApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateOpenAICompatibleApiKey: vi.fn(() => Promise.resolve({ valid: true })),
    validateOllamaConnection: vi.fn(() => Promise.resolve({ valid: true })),
    validateLiteLLMConnection: vi.fn(() => Promise.resolve({ valid: true })),
    validateLMStudioConnection: vi.fn(() => Promise.resolve({ valid: true })),
    testLMStudioConnection: vi.fn(() => Promise.resolve({ success: true, models: [] })),
    fetchLMStudioModels: vi.fn(() => Promise.resolve({ success: true, models: [] })),
    validateLMStudioConfig: vi.fn(),
    validateAzureFoundryConnection: vi.fn(() => Promise.resolve({ valid: true })),
    validateMoonshotApiKey: vi.fn(() => Promise.resolve({ valid: true })),
  };
});

let mockApiKeys: Record<string, string | null> = {};
let mockStoredCredentials: Array<{ account: string; password: string }> = [];

vi.mock('@main/store/secureStorage', () => ({
  storeApiKey: vi.fn((provider: string, key: string) => {
    mockApiKeys[provider] = key;
    mockStoredCredentials.push({ account: `apiKey:${provider}`, password: key });
  }),
  getApiKey: vi.fn((provider: string) => mockApiKeys[provider] || null),
  deleteApiKey: vi.fn((provider: string) => {
    delete mockApiKeys[provider];
    mockStoredCredentials = mockStoredCredentials.filter((c) => c.account !== `apiKey:${provider}`);
  }),
  getAllApiKeys: vi.fn(() =>
    Promise.resolve({
      anthropic: mockApiKeys.anthropic ?? null,
      openai: mockApiKeys.openai ?? null,
      google: mockApiKeys.google ?? null,
      xai: mockApiKeys.xai ?? null,
      custom: mockApiKeys.custom ?? null,
    }),
  ),
  hasAnyApiKey: vi.fn(() => Promise.resolve(Object.values(mockApiKeys).some((k) => k !== null))),
  listStoredCredentials: vi.fn(() => mockStoredCredentials),
}));

// Note: App settings and provider settings are now mocked via @myboteam/core mock above

const mockLogFn = vi.fn();
const mockLogCollector = { log: mockLogFn, logEnv: vi.fn() };
vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => mockLogCollector),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      writeFileSync: vi.fn(),
      existsSync: vi.fn(() => false),
      copyFileSync: vi.fn(),
      promises: {
        writeFile: vi.fn(() => Promise.resolve()),
        access: vi.fn(() => Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))),
        stat: vi.fn(() => Promise.resolve({ size: 1024 })),
      },
    },
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => false),
    copyFileSync: vi.fn(),
    promises: {
      writeFile: vi.fn(() => Promise.resolve()),
      access: vi.fn(() => Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))),
      stat: vi.fn(() => Promise.resolve({ size: 1024 })),
    },
  };
});

import fs from 'node:fs';

import { registerIPCHandlers } from '@main/ipc/handlers';
import { BrowserWindow as _BrowserWindow, dialog, ipcMain, shell } from 'electron';

type MockedIpcMain = typeof ipcMain & {
  _getHandler: (channel: string) => ((...args: unknown[]) => unknown) | undefined;
  _getHandlers: () => Map<string, (...args: unknown[]) => unknown>;
  _clear: () => void;
};

const mockedIpcMain = ipcMain as MockedIpcMain;

async function invokeHandler(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = mockedIpcMain._getHandler(channel);
  if (!handler) {
    throw new Error(`No handler registered for channel: ${channel}`);
  }

  const mockEvent = {
    sender: {
      send: vi.fn(),
      isDestroyed: vi.fn(() => false),
    },
  };

  return handler(mockEvent, ...args);
}

describe('IPC Handlers Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIpcMain._clear();
    mockTasks.length = 0;
    mockFavorites.length = 0;
    mockApiKeys = {};
    mockStoredCredentials = [];
    mockDebugMode = false;
    mockOnboardingComplete = false;
    mockSelectedModel = null;

    mockTaskManager.startTask.mockReset();
    mockTaskManager.cancelTask.mockReset();
    mockTaskManager.interruptTask.mockReset();
    mockTaskManager.sendResponse.mockReset();
    mockTaskManager.hasActiveTask.mockReturnValue(false);
    mockTaskManager.getActiveTaskId.mockReturnValue(null);
    mockTaskManager.getSessionId.mockReturnValue(null);
    mockTaskManager.isTaskQueued.mockReturnValue(false);
    mockTaskManager.cancelQueuedTask.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerIPCHandlers', () => {
    it('should register all expected IPC handlers', () => {
      registerIPCHandlers();

      const handlers = mockedIpcMain._getHandlers();

      expect(handlers.has('task:start')).toBe(true);
      expect(handlers.has('task:cancel')).toBe(true);
      expect(handlers.has('task:interrupt')).toBe(true);
      expect(handlers.has('task:get')).toBe(true);
      expect(handlers.has('task:list')).toBe(true);
      expect(handlers.has('task:delete')).toBe(true);
      expect(handlers.has('task:clear-history')).toBe(true);

      expect(handlers.has('permission:respond')).toBe(true);

      expect(handlers.has('session:resume')).toBe(true);

      expect(handlers.has('settings:api-keys')).toBe(true);
      expect(handlers.has('settings:add-api-key')).toBe(true);
      expect(handlers.has('settings:remove-api-key')).toBe(true);
      expect(handlers.has('settings:debug-mode')).toBe(true);
      expect(handlers.has('settings:set-debug-mode')).toBe(true);
      expect(handlers.has('settings:app-settings')).toBe(true);

      expect(handlers.has('api-key:exists')).toBe(true);
      expect(handlers.has('api-key:set')).toBe(true);
      expect(handlers.has('api-key:get')).toBe(true);
      expect(handlers.has('api-key:validate')).toBe(true);
      expect(handlers.has('api-key:validate-provider')).toBe(true);
      expect(handlers.has('api-key:clear')).toBe(true);

      expect(handlers.has('api-keys:all')).toBe(true);
      expect(handlers.has('api-keys:has-any')).toBe(true);

      expect(handlers.has('opencode:check')).toBe(true);
      expect(handlers.has('opencode:version')).toBe(true);
      expect(handlers.has('opencode:auth:slack:status')).toBe(true);
      expect(handlers.has('opencode:auth:slack:login')).toBe(true);
      expect(handlers.has('opencode:auth:slack:logout')).toBe(true);

      expect(handlers.has('model:get')).toBe(true);
      expect(handlers.has('model:set')).toBe(true);

      expect(handlers.has('onboarding:complete')).toBe(true);
      expect(handlers.has('onboarding:set-complete')).toBe(true);

      expect(handlers.has('shell:open-external')).toBe(true);

      expect(handlers.has('huggingface-local:start-server')).toBe(true);
      expect(handlers.has('huggingface-local:stop-server')).toBe(true);
      expect(handlers.has('huggingface-local:server-status')).toBe(true);
      expect(handlers.has('huggingface-local:test-connection')).toBe(true);
      expect(handlers.has('huggingface-local:download-model')).toBe(true);
      expect(handlers.has('huggingface-local:list-models')).toBe(true);
      expect(handlers.has('huggingface-local:delete-model')).toBe(true);

      expect(handlers.has('log:event')).toBe(true);
    });
  });

  describe('API Key Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('api-key:exists should return false when no key is stored', async () => {
      const result = await invokeHandler('api-key:exists');

      expect(result).toBe(false);
    });

    it('api-key:set should store the API key', async () => {
      const testKey = 'sk-test-12345678-abcdef';

      await invokeHandler('api-key:set', testKey);
      mockApiKeys.anthropic = testKey;
      const exists = await invokeHandler('api-key:exists');

      expect(exists).toBe(true);
    });

    it('api-key:get should retrieve the stored API key', async () => {
      const testKey = 'sk-test-retrieve-key';
      mockApiKeys.anthropic = testKey;

      const result = await invokeHandler('api-key:get');

      expect(result).toBe(testKey);
    });

    it('api-key:clear should remove the stored API key', async () => {
      mockApiKeys.anthropic = 'sk-test-to-delete';

      await invokeHandler('api-key:clear');

      const { deleteApiKey } = await import('@main/store/secureStorage');
      expect(deleteApiKey).toHaveBeenCalledWith('anthropic');
    });

    it('api-key:set should reject empty keys', async () => {
      await expect(invokeHandler('api-key:set', '')).rejects.toThrow();
      await expect(invokeHandler('api-key:set', '   ')).rejects.toThrow();
    });

    it('api-key:set should reject keys exceeding max length', async () => {
      const longKey = 'x'.repeat(300);

      await expect(invokeHandler('api-key:set', longKey)).rejects.toThrow('exceeds maximum length');
    });
  });

  describe('Settings Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('settings:debug-mode should return current debug mode', async () => {
      mockDebugMode = true;

      const result = await invokeHandler('settings:debug-mode');

      expect(result).toBe(true);
    });

    it('settings:set-debug-mode should update debug mode', async () => {
      mockDebugMode = false;

      await invokeHandler('settings:set-debug-mode', true);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setDebugMode', {
        enabled: true,
      });
    });

    it('settings:set-debug-mode should reject non-boolean values', async () => {
      await expect(invokeHandler('settings:set-debug-mode', 'true')).rejects.toThrow(
        'Invalid debug mode flag',
      );
      await expect(invokeHandler('settings:set-debug-mode', 1)).rejects.toThrow(
        'Invalid debug mode flag',
      );
    });

    it('settings:app-settings should return all app settings', async () => {
      mockDebugMode = true;
      mockOnboardingComplete = true;
      mockSelectedModel = { provider: 'anthropic', model: 'claude-3-opus' };
      mockOpenAiBaseUrl = '';

      const result = await invokeHandler('settings:app-settings');

      expect(result).toEqual({
        debugMode: true,
        onboardingComplete: true,
        selectedModel: { provider: 'anthropic', model: 'claude-3-opus' },
        openaiBaseUrl: '',
      });
    });

    it('settings:api-keys should return list of stored API keys', async () => {
      // Note: The handler now uses getAllApiKeys() which reads from mockApiKeys
      mockApiKeys = {
        anthropic: 'sk-ant-12345678',
        openai: 'sk-openai-abcdefgh',
      };

      const result = await invokeHandler('settings:api-keys');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: 'anthropic',
            keyPrefix: 'sk-ant-1...',
          }),
          expect.objectContaining({
            provider: 'openai',
            keyPrefix: 'sk-opena...',
          }),
        ]),
      );
    });

    it('settings:add-api-key should store API key for valid provider', async () => {
      const provider = 'anthropic';
      const key = 'sk-ant-new-key-12345';

      const result = await invokeHandler('settings:add-api-key', provider, key);

      expect(result).toEqual(
        expect.objectContaining({
          provider: 'anthropic',
          keyPrefix: 'sk-ant-n...',
          isActive: true,
        }),
      );
    });

    it('settings:add-api-key should reject unsupported providers', async () => {
      await expect(
        invokeHandler('settings:add-api-key', 'unsupported-provider', 'sk-test'),
      ).rejects.toThrow('Unsupported API key provider');
    });

    it('settings:remove-api-key should delete the API key', async () => {
      mockApiKeys.openai = 'sk-openai-test';

      await invokeHandler('settings:remove-api-key', 'local-openai');

      const { deleteApiKey } = await import('@main/store/secureStorage');
      expect(deleteApiKey).toHaveBeenCalledWith('openai');
    });

    it('opencode:auth:slack:status should return Slack MCP auth status', async () => {
      const { getSlackMcpOauthStatus } = await import('@myboteam/agent-core/desktop-main');
      vi.mocked(getSlackMcpOauthStatus).mockReturnValue({
        connected: true,
        pendingAuthorization: false,
      });

      const result = await invokeHandler('opencode:auth:slack:status');

      expect(result).toEqual({
        connected: true,
        pendingAuthorization: false,
      });
    });

    it('opencode:auth:slack:login should start Slack MCP authentication', async () => {
      const { loginSlackMcp } = await import('@main/opencode/slack-auth');

      const result = await invokeHandler('opencode:auth:slack:login');

      expect(loginSlackMcp).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('opencode:auth:slack:logout should clear Slack MCP authentication', async () => {
      const { logoutSlackMcp } = await import('@main/opencode/slack-auth');

      await invokeHandler('opencode:auth:slack:logout');

      expect(logoutSlackMcp).toHaveBeenCalled();
    });
  });

  describe('Task Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('task:start should proxy to daemon and return task', async () => {
      const config = { prompt: 'Test task prompt' };

      const result = await invokeHandler('task:start', config);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({ prompt: 'Test task prompt' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          prompt: 'Test task prompt',
          status: 'running',
        }),
      );
    });

    it('task:start should proxy to daemon', async () => {
      const config = { prompt: 'Test prompt' };

      const result = await invokeHandler('task:start', config);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({ prompt: 'Test prompt' }),
      );
      expect(result).toEqual(expect.objectContaining({ prompt: 'Test prompt', status: 'running' }));
    });

    it('task:cancel should proxy to daemon', async () => {
      const taskId = 'task_to_cancel';

      await invokeHandler('task:cancel', taskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.cancel', { taskId });
    });

    it('task:cancel should proxy queued task to daemon', async () => {
      const taskId = 'task_queued';

      await invokeHandler('task:cancel', taskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.cancel', { taskId });
    });

    it('task:cancel should do nothing for undefined taskId', async () => {
      await invokeHandler('task:cancel', undefined);

      expect(mockDaemonClient.call).not.toHaveBeenCalledWith('task.cancel', expect.anything());
    });

    it('task:interrupt should proxy to daemon', async () => {
      const taskId = 'task_to_interrupt';

      await invokeHandler('task:interrupt', taskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.interrupt', { taskId });
    });

    it('task:get should proxy to daemon and return task', async () => {
      mockTasks.push({
        id: 'task_existing',
        prompt: 'Existing task',
        status: 'completed',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      const result = await invokeHandler('task:get', 'task_existing');

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.get', { taskId: 'task_existing' });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'task_existing',
          prompt: 'Existing task',
        }),
      );
    });

    it('task:get should return null for non-existent task', async () => {
      const result = await invokeHandler('task:get', 'task_nonexistent');

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.get', {
        taskId: 'task_nonexistent',
      });
      expect(result).toBeNull();
    });

    it('task:list should proxy to daemon', async () => {
      mockTasks.push(
        {
          id: 'task_1',
          prompt: 'Task 1',
          status: 'completed',
          messages: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task_2',
          prompt: 'Task 2',
          status: 'running',
          messages: [],
          createdAt: new Date().toISOString(),
        },
      );

      const result = await invokeHandler('task:list');

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.list', expect.any(Object));
      expect(result).toHaveLength(2);
    });

    it('task:delete should proxy to daemon', async () => {
      await invokeHandler('task:delete', 'task_to_delete');

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.delete', {
        taskId: 'task_to_delete',
      });
    });

    it('task:clear-history should proxy to daemon', async () => {
      await invokeHandler('task:clear-history');

      expect(mockDaemonClient.call).toHaveBeenCalledWith('task.clearHistory');
    });
  });

  describe('Onboarding Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('onboarding:complete should return false when not completed', async () => {
      mockOnboardingComplete = false;

      const result = await invokeHandler('onboarding:complete');

      expect(result).toBe(false);
    });

    it('onboarding:complete should return true when completed', async () => {
      mockOnboardingComplete = true;

      const result = await invokeHandler('onboarding:complete');

      expect(result).toBe(true);
    });

    it('onboarding:complete should return true if user has task history', async () => {
      mockOnboardingComplete = false;
      mockTasks.push({
        id: 'existing_task',
        prompt: 'Existing task',
        status: 'completed',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      const result = await invokeHandler('onboarding:complete');

      expect(result).toBe(true);
    });

    it('onboarding:set-complete should update onboarding status', async () => {
      mockOnboardingComplete = false;

      await invokeHandler('onboarding:set-complete', true);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setOnboardingComplete', {
        complete: true,
      });
    });
  });

  describe('Permission Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('permission:respond should proxy to daemon', async () => {
      const response = {
        requestId: 'req_123',
        taskId: 'task_active',
        decision: 'allow',
      };

      await invokeHandler('permission:respond', response);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('permission.respond', response);
    });

    it('permission:respond should proxy deny to daemon', async () => {
      const response = {
        requestId: 'req_123',
        taskId: 'task_active',
        decision: 'deny',
      };

      await invokeHandler('permission:respond', response);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('permission.respond', response);
    });

    it('permission:respond should proxy file permission to daemon', async () => {
      const response = {
        requestId: 'filereq_123_abc',
        taskId: 'task_active',
        decision: 'allow',
      };

      await invokeHandler('permission:respond', response);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('permission.respond', response);
    });
  });

  describe('Model Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('model:get should return selected model', async () => {
      mockSelectedModel = { provider: 'anthropic', model: 'claude-3-sonnet' };

      const result = await invokeHandler('model:get');

      expect(result).toEqual({ provider: 'anthropic', model: 'claude-3-sonnet' });
    });

    it('model:get should return null when no model selected', async () => {
      mockSelectedModel = null;

      const result = await invokeHandler('model:get');

      expect(result).toBeNull();
    });

    it('model:set should update selected model', async () => {
      const newModel = { provider: 'openai', model: 'gpt-4' };

      await invokeHandler('model:set', newModel);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setSelectedModel', {
        model: newModel,
      });
    });

    it('model:set should reject invalid model configuration', async () => {
      await expect(invokeHandler('model:set', null)).rejects.toThrow('Invalid model configuration');
      await expect(invokeHandler('model:set', { provider: 'test' })).rejects.toThrow(
        'Invalid model configuration',
      );
      await expect(invokeHandler('model:set', { model: 'test' })).rejects.toThrow(
        'Invalid model configuration',
      );
    });
  });

  describe('Shell Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('shell:open-external should open valid http URL', async () => {
      const url = 'https://example.com';

      await invokeHandler('shell:open-external', url);

      expect(shell.openExternal).toHaveBeenCalledWith(url);
    });

    it('shell:open-external should open valid https URL', async () => {
      const url = 'http://localhost:3000';

      await invokeHandler('shell:open-external', url);

      expect(shell.openExternal).toHaveBeenCalledWith(url);
    });

    it('shell:open-external should reject non-http/https protocols', async () => {
      await expect(invokeHandler('shell:open-external', 'file:///etc/passwd')).rejects.toThrow(
        'must use http or https protocol',
      );
      await expect(invokeHandler('shell:open-external', 'javascript:alert(1)')).rejects.toThrow(
        'must use http or https protocol',
      );
    });

    it('shell:open-external should reject invalid URLs', async () => {
      await expect(invokeHandler('shell:open-external', 'not-a-url')).rejects.toThrow();
    });
  });

  describe('OpenCode Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('opencode:check should return CLI status', async () => {
      const result = (await invokeHandler('opencode:check')) as {
        installed: boolean;
        version: string;
        installCommand: string;
      };

      expect(result).toEqual(
        expect.objectContaining({
          installed: true,
          version: '1.0.0',
          installCommand: 'npm install -g opencode-ai',
        }),
      );
    });

    it('opencode:version should return CLI version', async () => {
      const result = await invokeHandler('opencode:version');

      expect(result).toBe('1.0.0');
    });
  });

  describe('Multi-Provider API Key Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('api-keys:all should return masked keys for all providers', async () => {
      mockApiKeys = {
        anthropic: 'sk-ant-12345678',
        openai: null,
        google: 'AIza1234567890',
        xai: null,
        custom: null,
      };

      const result = (await invokeHandler('api-keys:all')) as Record<
        string,
        { exists: boolean; prefix?: string }
      >;

      expect(result.anthropic).toEqual({
        exists: true,
        prefix: 'sk-ant-1...',
      });
      expect(result.openai).toEqual({ exists: false, prefix: undefined });
      expect(result.google).toEqual({
        exists: true,
        prefix: 'AIza1234...',
      });
    });

    it('api-keys:has-any should return true when any key exists', async () => {
      mockApiKeys.anthropic = 'sk-test';

      const result = await invokeHandler('api-keys:has-any');

      expect(result).toBe(true);
    });

    it('api-keys:has-any should return false when no keys exist', async () => {
      const result = await invokeHandler('api-keys:has-any');

      expect(result).toBe(false);
    });
  });

  describe('Session Handlers', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('session:resume should proxy to daemon with session ID', async () => {
      const sessionId = 'session_123';
      const prompt = 'Continue with the task';

      const result = await invokeHandler('session:resume', sessionId, prompt);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'session.resume',
        expect.objectContaining({
          sessionId,
          prompt,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          prompt,
          status: 'running',
        }),
      );
    });

    it('session:resume should pass existing task ID to daemon', async () => {
      const sessionId = 'session_123';
      const prompt = 'Continue';
      const existingTaskId = 'task_existing';

      await invokeHandler('session:resume', sessionId, prompt, existingTaskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'session.resume',
        expect.objectContaining({
          sessionId,
          prompt,
          existingTaskId,
        }),
      );
    });

    it('session:resume should validate session ID', async () => {
      await expect(invokeHandler('session:resume', '', 'prompt')).rejects.toThrow();
      await expect(invokeHandler('session:resume', '   ', 'prompt')).rejects.toThrow();
    });

    it('session:resume should validate prompt', async () => {
      await expect(invokeHandler('session:resume', 'session_123', '')).rejects.toThrow();
      await expect(invokeHandler('session:resume', 'session_123', '   ')).rejects.toThrow();
    });
  });

  describe('Log Event Handler', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('log:event should return ok response', async () => {
      const payload = {
        level: 'info',
        message: 'Test log message',
        context: { key: 'value' },
      };

      const result = await invokeHandler('log:event', payload);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('Task Callbacks and Message Batching', () => {
    beforeEach(() => {
      registerIPCHandlers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('task:start should proxy to daemon and return task', async () => {
      const config = { prompt: 'Test task prompt' };

      const result = await invokeHandler('task:start', config);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({ prompt: 'Test task prompt' }),
      );
      expect(result).toEqual(
        expect.objectContaining({ prompt: 'Test task prompt', status: 'running' }),
      );
    });

    it('task:start should call daemon for each invocation', async () => {
      await invokeHandler('task:start', { prompt: 'First task' });
      await invokeHandler('task:start', { prompt: 'Second task' });

      const startCalls = mockDaemonClient.call.mock.calls.filter(
        ([method]) => method === 'task.start',
      );
      expect(startCalls).toHaveLength(2);
      expect(startCalls[0][1]).toEqual(expect.objectContaining({ prompt: 'First task' }));
      expect(startCalls[1][1]).toEqual(expect.objectContaining({ prompt: 'Second task' }));
    });

    it('task:start should return daemon response directly', async () => {
      const config = { prompt: 'My test prompt' };

      const result = (await invokeHandler('task:start', config)) as {
        id: string;
        prompt: string;
        status: string;
      };

      expect(result.prompt).toBe('My test prompt');
      expect(result.status).toBe('running');
    });

    it('task:start should proxy to daemon without calling storage directly', async () => {
      const config = { prompt: 'Save me' };

      await invokeHandler('task:start', config);

      const { saveTask } = await import('@myboteam/agent-core');
      expect(saveTask).not.toHaveBeenCalled();
      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({ prompt: 'Save me' }),
      );
    });

    it('task:start should pass prompt and workingDirectory to daemon', async () => {
      const config = {
        prompt: 'Full config test',
        workingDirectory: '/some/path',
      };

      await invokeHandler('task:start', config);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({
          prompt: 'Full config test',
          workingDirectory: '/some/path',
        }),
      );
    });

    it('task:start should generate a taskId and pass it to daemon', async () => {
      const config = { prompt: 'Tools test' };

      await invokeHandler('task:start', config);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'task.start',
        expect.objectContaining({
          taskId: expect.stringMatching(/^task_/),
        }),
      );
    });

    it('task:cancel should do nothing when taskId is undefined', async () => {
      await invokeHandler('task:cancel', undefined);

      expect(mockTaskManager.cancelTask).not.toHaveBeenCalled();
      expect(mockTaskManager.cancelQueuedTask).not.toHaveBeenCalled();
    });

    it('task:interrupt should do nothing when taskId is undefined', async () => {
      await invokeHandler('task:interrupt', undefined);

      expect(mockTaskManager.interruptTask).not.toHaveBeenCalled();
    });

    it('task:interrupt should do nothing for inactive task', async () => {
      mockTaskManager.hasActiveTask.mockReturnValue(false);

      await invokeHandler('task:interrupt', 'task_inactive');

      expect(mockTaskManager.interruptTask).not.toHaveBeenCalled();
    });
  });

  describe('Session Resume with Existing Task', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('session:resume should proxy to daemon with existing task ID', async () => {
      const sessionId = 'session_existing';
      const prompt = 'Follow-up message';
      const existingTaskId = 'task_existing';

      await invokeHandler('session:resume', sessionId, prompt, existingTaskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'session.resume',
        expect.objectContaining({
          sessionId: 'session_existing',
          prompt: 'Follow-up message',
          existingTaskId: 'task_existing',
        }),
      );
    });

    it('session:resume should return task from daemon', async () => {
      const sessionId = 'session_status';
      const prompt = 'Status update test';
      const existingTaskId = 'task_status';

      const result = (await invokeHandler('session:resume', sessionId, prompt, existingTaskId)) as {
        id: string;
        status: string;
      };

      expect(result).toEqual(expect.objectContaining({ id: existingTaskId, status: 'running' }));
      const { updateTaskStatus } = await import('@myboteam/agent-core');
      expect(updateTaskStatus).not.toHaveBeenCalled();
    });

    it('session:resume should proxy to daemon without existing task ID', async () => {
      const sessionId = 'session_new';
      const prompt = 'New session';

      await invokeHandler('session:resume', sessionId, prompt);

      expect(mockDaemonClient.call).toHaveBeenCalledWith(
        'session.resume',
        expect.objectContaining({
          sessionId: 'session_new',
          prompt: 'New session',
        }),
      );

      const { addTaskMessage } = await import('@myboteam/agent-core');
      expect(addTaskMessage).not.toHaveBeenCalled();
    });
  });

  describe('Permission Response Edge Cases', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('permission:respond should proxy to daemon with selectedOptions', async () => {
      const response = {
        requestId: 'req_456',
        taskId: 'task_options',
        decision: 'allow',
        selectedOptions: ['option1', 'option2', 'option3'],
      };

      await invokeHandler('permission:respond', response);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('permission.respond', response);
    });

    it('permission:respond should proxy to daemon for file permission requests', async () => {
      const response = {
        requestId: 'filereq_notfound',
        taskId: 'task_notfound',
        decision: 'allow',
      };

      await invokeHandler('permission:respond', response);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('permission.respond', response);
    });
  });

  describe('Window Trust Validation', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('should throw error when window is destroyed', async () => {
      const { BrowserWindow } = await import('electron');
      (BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 1,
        isDestroyed: () => true,
        webContents: { send: vi.fn(), isDestroyed: () => true },
      });

      await expect(invokeHandler('task:start', { prompt: 'Test' })).rejects.toThrow(
        'Untrusted window',
      );
    });

    it('should throw error when window is null', async () => {
      const { BrowserWindow } = await import('electron');
      (BrowserWindow.fromWebContents as Mock).mockReturnValue(null);

      await expect(invokeHandler('task:start', { prompt: 'Test' })).rejects.toThrow(
        'Untrusted window',
      );
    });

    it('should throw error when IPC from non-focused window with multiple windows', async () => {
      const { BrowserWindow } = await import('electron');
      (BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 2,
        isDestroyed: () => false,
        webContents: { send: vi.fn(), isDestroyed: () => false },
      });
      (BrowserWindow.getFocusedWindow as Mock).mockReturnValue({
        id: 1,
        isDestroyed: () => false,
      });
      (BrowserWindow.getAllWindows as Mock).mockReturnValue([{ id: 1 }, { id: 2 }]);

      mockTaskManager.startTask.mockResolvedValue({
        id: 'task_test',
        prompt: 'Test',
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      await expect(invokeHandler('task:start', { prompt: 'Test' })).rejects.toThrow(
        'IPC request must originate from the focused window',
      );
    });

    it('should allow IPC when only one window exists', async () => {
      const { BrowserWindow } = await import('electron');
      (BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 1,
        isDestroyed: () => false,
        webContents: { send: vi.fn(), isDestroyed: () => false },
      });
      (BrowserWindow.getFocusedWindow as Mock).mockReturnValue({
        id: 2,
        isDestroyed: () => false,
      });
      (BrowserWindow.getAllWindows as Mock).mockReturnValue([{ id: 1 }]);

      mockTaskManager.startTask.mockResolvedValue({
        id: 'task_single',
        prompt: 'Test',
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      const result = await invokeHandler('task:start', { prompt: 'Test' });

      expect(result).toBeDefined();
    });
  });

  describe('E2E Skip Auth Mode', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('onboarding:complete should return true when E2E_SKIP_AUTH env is set', async () => {
      const originalEnv = process.env.E2E_SKIP_AUTH;
      process.env.E2E_SKIP_AUTH = '1';

      const result = await invokeHandler('onboarding:complete');

      expect(result).toBe(true);

      process.env.E2E_SKIP_AUTH = originalEnv;
    });

    it('opencode:check should return mock status when E2E_SKIP_AUTH is set', async () => {
      const originalEnv = process.env.E2E_SKIP_AUTH;
      process.env.E2E_SKIP_AUTH = '1';

      const result = (await invokeHandler('opencode:check')) as {
        installed: boolean;
        version: string;
      };

      expect(result.installed).toBe(true);
      expect(result.version).toBe('1.0.0-test');

      process.env.E2E_SKIP_AUTH = originalEnv;
    });
  });

  describe('API Key Validation Timeout', () => {
    beforeEach(() => {
      registerIPCHandlers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('api-key:validate should handle abort error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          return Promise.reject(abortError);
        }),
      );

      const result = (await invokeHandler('api-key:validate', 'sk-test-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('api-key:validate should handle network errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const result = (await invokeHandler('api-key:validate', 'sk-test-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Failed to validate');
    });

    it('api-key:validate should return invalid for non-200 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
        }),
      );

      const result = (await invokeHandler('api-key:validate', 'sk-test-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('api-key:validate should return valid for 200 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        }),
      );

      const result = (await invokeHandler('api-key:validate', 'sk-test-key')) as {
        valid: boolean;
      };

      expect(result.valid).toBe(true);
    });
  });

  describe('Multi-Provider API Key Validation', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('api-key:validate-provider should reject unsupported provider', async () => {
      const result = (await invokeHandler(
        'api-key:validate-provider',
        'invalid-provider',
        'key',
      )) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported provider');
    });

    it('api-key:validate-provider should skip validation for custom provider', async () => {
      const result = (await invokeHandler('api-key:validate-provider', 'custom', 'any-key')) as {
        valid: boolean;
      };

      expect(result.valid).toBe(true);
    });

    it('api-key:validate-provider should validate OpenAI key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = (await invokeHandler(
        'api-key:validate-provider',
        'openai',
        'sk-openai-key',
      )) as {
        valid: boolean;
      };

      expect(result.valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-openai-key',
          }),
        }),
      );
    });

    it('api-key:validate-provider should validate Google key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = (await invokeHandler(
        'api-key:validate-provider',
        'google',
        'AIza-test-key',
      )) as {
        valid: boolean;
      };

      expect(result.valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?key=AIza-test-key',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('api-key:validate-provider should handle AbortError', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

      const result = (await invokeHandler('api-key:validate-provider', 'openai', 'sk-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('api-key:validate-provider should handle failed response with error message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: { message: 'Access denied' } }),
        }),
      );

      const result = (await invokeHandler('api-key:validate-provider', 'openai', 'sk-bad-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('api-key:validate-provider should handle failed response without error message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      );

      const result = (await invokeHandler('api-key:validate-provider', 'openai', 'sk-key')) as {
        valid: boolean;
        error: string;
      };

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API returned status 500');
    });
  });

  describe('Settings Add API Key with Label', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('settings:add-api-key should accept and return custom label', async () => {
      const provider = 'anthropic';
      const key = 'sk-custom-labeled-key';
      const label = 'My Production Key';

      const result = (await invokeHandler('settings:add-api-key', provider, key, label)) as {
        label: string;
      };

      expect(result.label).toBe('My Production Key');
    });

    it('settings:add-api-key should use default label when not provided', async () => {
      const provider = 'anthropic';
      const key = 'sk-no-label-key';

      const result = (await invokeHandler('settings:add-api-key', provider, key)) as {
        label: string;
      };

      expect(result.label).toBe('Local API Key');
    });

    it('settings:add-api-key should validate label length', async () => {
      const provider = 'anthropic';
      const key = 'sk-valid-key';
      const longLabel = 'x'.repeat(200);

      await expect(invokeHandler('settings:add-api-key', provider, key, longLabel)).rejects.toThrow(
        'exceeds maximum length',
      );
    });
  });

  describe('Settings API Keys with Empty Password', () => {
    beforeEach(() => {
      registerIPCHandlers();
    });

    it('settings:api-keys should handle empty password', async () => {
      // Note: The handler now uses getAllApiKeys() which reads from mockApiKeys
      mockApiKeys = {
        anthropic: '',
      };

      const result = (await invokeHandler('settings:api-keys')) as Array<{ keyPrefix: string }>;

      expect(result).toHaveLength(1);
      expect(result[0].keyPrefix).toBe('');
    });
  });

  // Note: Callback execution tests for onStatusChange, onDebug, onError, onComplete

  describe('Favorites Handlers', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockedIpcMain._clear();
      registerIPCHandlers();
    });

    it('favorites:add should add a completed task to favorites', async () => {
      const taskId = 'task_fav_add';
      mockTasks.push({
        id: taskId,
        prompt: 'Complete me',
        summary: 'Done',
        status: 'completed',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      await invokeHandler('favorites:add', taskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.add', {
        taskId,
        prompt: 'Complete me',
        summary: 'Done',
      });
    });

    it('favorites:add should add an interrupted task to favorites', async () => {
      const taskId = 'task_fav_interrupted';
      mockTasks.push({
        id: taskId,
        prompt: 'Resume later',
        summary: 'WIP',
        status: 'interrupted',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      await invokeHandler('favorites:add', taskId);

      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.add', {
        taskId,
        prompt: 'Resume later',
        summary: 'WIP',
      });
    });

    it('favorites:add should reject when task not found', async () => {
      await expect(invokeHandler('favorites:add', 'task_nonexistent')).rejects.toThrow(
        'Favorite failed: task not found (taskId: task_nonexistent)',
      );
      expect(mockDaemonClient.call).not.toHaveBeenCalledWith('favorites.add', expect.anything());
    });

    it('favorites:add should reject when task status is not completed or interrupted', async () => {
      const taskId = 'task_running';
      mockTasks.push({
        id: taskId,
        prompt: 'Running',
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
      });

      await expect(invokeHandler('favorites:add', taskId)).rejects.toThrow(
        'Favorite failed: invalid status (taskId: task_running, status: running)',
      );
      expect(mockDaemonClient.call).not.toHaveBeenCalledWith('favorites.add', expect.anything());
    });

    it('favorites:remove should remove task from favorites', async () => {
      await invokeHandler('favorites:remove', 'task_to_unfav');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.remove', {
        taskId: 'task_to_unfav',
      });
    });

    it('favorites:list should return favorites list', async () => {
      const result = await invokeHandler('favorites:list');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('favorites.list');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Debug Bug Report Handlers', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockedIpcMain._clear();

      (_BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 1,
        isDestroyed: vi.fn(() => false),
        webContents: {
          send: vi.fn(),
          isDestroyed: vi.fn(() => false),
          capturePage: vi.fn(() =>
            Promise.resolve({
              toPNG: () => Buffer.from('fake-png-data'),
              getSize: () => ({ width: 1920, height: 1080 }),
            }),
          ),
          executeJavaScript: vi.fn(() => Promise.resolve('{"tag":"body","children":[]}')),
        },
      });
      (_BrowserWindow.getFocusedWindow as Mock).mockReturnValue({
        id: 1,
        isDestroyed: () => false,
      });
      (_BrowserWindow.getAllWindows as Mock).mockReturnValue([
        { id: 1, webContents: { send: vi.fn() } },
      ]);

      (dialog.showSaveDialog as Mock).mockResolvedValue({
        canceled: false,
        filePath: '/tmp/bug-report.json',
      });

      mockDebugMode = true;

      (fs.writeFileSync as Mock).mockReset();
      (fs.promises.writeFile as unknown as Mock).mockReset();
      (fs.promises.writeFile as unknown as Mock).mockResolvedValue(undefined);
      (fs.promises.access as unknown as Mock).mockReset();
      (fs.promises.access as unknown as Mock).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
      );

      registerIPCHandlers();
    });

    it('should register all three debug handlers', () => {
      const handlers = mockedIpcMain._getHandlers();
      expect(handlers.has('debug:capture-screenshot')).toBe(true);
      expect(handlers.has('debug:capture-axtree')).toBe(true);
      expect(handlers.has('debug:generate-bug-report')).toBe(true);
    });

    it('debug:capture-screenshot should return base64 PNG data', async () => {
      const result = (await invokeHandler('debug:capture-screenshot')) as {
        success: boolean;
        data: string;
        width: number;
        height: number;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe(Buffer.from('fake-png-data').toString('base64'));
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('debug:capture-screenshot should handle errors gracefully', async () => {
      (_BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 1,
        isDestroyed: vi.fn(() => false),
        webContents: {
          send: vi.fn(),
          isDestroyed: vi.fn(() => false),
          capturePage: vi.fn(() => Promise.reject(new Error('Capture failed'))),
          executeJavaScript: vi.fn(),
        },
      });

      const result = (await invokeHandler('debug:capture-screenshot')) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Capture failed');
    });

    it('debug:capture-axtree should return JSON string', async () => {
      const result = (await invokeHandler('debug:capture-axtree')) as {
        success: boolean;
        data: string;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe('{"tag":"body","children":[]}');
    });

    it('debug:capture-axtree should handle errors gracefully', async () => {
      (_BrowserWindow.fromWebContents as Mock).mockReturnValue({
        id: 1,
        isDestroyed: vi.fn(() => false),
        webContents: {
          send: vi.fn(),
          isDestroyed: vi.fn(() => false),
          capturePage: vi.fn(),
          executeJavaScript: vi.fn(() => Promise.reject(new Error('Script execution failed'))),
        },
      });

      const result = (await invokeHandler('debug:capture-axtree')) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Script execution failed');
    });

    it('debug:generate-bug-report should save report via dialog and return success', async () => {
      const reportData = {
        taskId: 'task_123',
        taskPrompt: 'Test prompt',
        taskStatus: 'completed',
        messages: [{ type: 'user', content: 'hello' }],
        debugLogs: [{ type: 'info', message: 'log entry' }],
      };

      const result = (await invokeHandler('debug:generate-bug-report', reportData)) as {
        success: boolean;
        path: string;
      };

      expect(result.success).toBe(true);
      expect(result.path).toBe('/tmp/bug-report.json');
      expect(dialog.showSaveDialog).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);

      const writtenContent = JSON.parse(
        (fs.promises.writeFile as unknown as Mock).mock.calls[0][1] as string,
      ) as { task: { id: string; prompt: string }; hasScreenshot: boolean };
      expect(writtenContent.task.id).toBe('task_123');
      expect(writtenContent.task.prompt).toBe('Test prompt');
      expect(writtenContent.hasScreenshot).toBe(false);
    });

    it('debug:generate-bug-report should handle dialog cancellation', async () => {
      (dialog.showSaveDialog as Mock).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });

      const result = (await invokeHandler('debug:generate-bug-report', {})) as {
        success: boolean;
        reason: string;
      };

      expect(result.success).toBe(false);
      expect(result.reason).toBe('cancelled');
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('debug:generate-bug-report should handle write errors', async () => {
      (fs.promises.writeFile as unknown as Mock).mockRejectedValueOnce(
        new Error('Permission denied'),
      );

      const result = (await invokeHandler('debug:generate-bug-report', {
        taskId: 'task_err',
      })) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('debug:generate-bug-report should save screenshot file when provided', async () => {
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const screenshotBase64 = Buffer.concat([pngMagic, Buffer.from('fake-png-data')]).toString(
        'base64',
      );
      const reportData = {
        taskId: 'task_with_screenshot',
        taskPrompt: 'Screenshot test',
        taskStatus: 'completed',
        screenshot: screenshotBase64,
      };

      const result = (await invokeHandler('debug:generate-bug-report', reportData)) as {
        success: boolean;
        path: string;
      };

      expect(result.success).toBe(true);

      expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);

      const calls = (fs.promises.writeFile as unknown as Mock).mock.calls;
      const jsonCall = calls.find((c: unknown[]) => typeof c[1] === 'string') as
        | [string, string]
        | undefined;
      const pngCall = calls.find((c: unknown[]) => Buffer.isBuffer(c[1])) as
        | [string, Buffer]
        | undefined;

      expect(jsonCall).toBeDefined();
      const jsonContent = JSON.parse(jsonCall![1]) as { hasScreenshot: boolean };
      expect(jsonContent.hasScreenshot).toBe(true);

      expect(pngCall).toBeDefined();
      expect(pngCall![0]).toContain('bug-report');
      expect(Buffer.isBuffer(pngCall![1])).toBe(true);
    });

    it('debug:capture-screenshot should return error when no window found', async () => {
      (_BrowserWindow.fromWebContents as Mock).mockReturnValue(null);

      const result = (await invokeHandler('debug:capture-screenshot')) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Untrusted window');
    });

    it('debug:capture-axtree should return error when no window found', async () => {
      (_BrowserWindow.fromWebContents as Mock).mockReturnValue(null);

      const result = (await invokeHandler('debug:capture-axtree')) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Untrusted window');
    });

    it('debug:generate-bug-report should return error when no window found', async () => {
      (_BrowserWindow.fromWebContents as Mock).mockReturnValue(null);

      const result = (await invokeHandler('debug:generate-bug-report', {
        taskId: 'test',
      })) as {
        success: boolean;
        error: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Untrusted window');
    });
  });
});
