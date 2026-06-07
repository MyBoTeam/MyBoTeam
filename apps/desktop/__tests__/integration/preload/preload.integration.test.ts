import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pkg from '../../../package.json';

const mockExposeInMainWorld = vi.fn();
const mockInvoke = vi.fn(() => Promise.resolve(undefined));
const mockOn = vi.fn();
const mockRemoveListener = vi.fn();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
  ipcRenderer: {
    invoke: mockInvoke,
    on: mockOn,
    removeListener: mockRemoveListener,
  },
}));

let capturedMyBoTeamAPI: Record<string, unknown> = {};
let capturedMyBoTeamShell: Record<string, unknown> = {};

describe('Preload Script Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    capturedMyBoTeamAPI = {};
    capturedMyBoTeamShell = {};

    process.env.npm_package_version = pkg.version;

    mockExposeInMainWorld.mockImplementation((name: string, api: unknown) => {
      if (name === 'myboteam') {
        capturedMyBoTeamAPI = api as Record<string, unknown>;
      } else if (name === 'myboteamShell') {
        capturedMyBoTeamShell = api as Record<string, unknown>;
      }
    });

    vi.resetModules();
    await import('../../../src/preload/index');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Exposure', () => {
    it('should expose myboteam API via contextBridge', () => {
      expect(mockExposeInMainWorld).toHaveBeenCalledWith('myboteam', expect.any(Object));
      expect(capturedMyBoTeamAPI).toBeDefined();
    });

    it('should expose myboteamShell info via contextBridge', () => {
      expect(mockExposeInMainWorld).toHaveBeenCalledWith('myboteamShell', expect.any(Object));
      expect(capturedMyBoTeamShell).toBeDefined();
    });

    it('should expose shell info with isElectron=true', () => {
      expect(capturedMyBoTeamShell.isElectron).toBe(true);
    });

    it('should expose shell info with platform', () => {
      expect(capturedMyBoTeamShell.platform).toBe(process.platform);
    });

    it('should expose shell info with version matching package.json', () => {
      expect(capturedMyBoTeamShell.version).toBe(pkg.version);
    });
  });

  describe('IPC Method Invocations', () => {
    describe('App Info', () => {
      it('getVersion should invoke app:version', async () => {
        await (capturedMyBoTeamAPI.getVersion as () => Promise<string>)();
        expect(mockInvoke).toHaveBeenCalledWith('app:version');
      });

      it('getPlatform should invoke app:platform', async () => {
        await (capturedMyBoTeamAPI.getPlatform as () => Promise<string>)();
        expect(mockInvoke).toHaveBeenCalledWith('app:platform');
      });
    });

    describe('Shell Operations', () => {
      it('openExternal should invoke shell:open-external with URL', async () => {
        const url = 'https://example.com';
        await (capturedMyBoTeamAPI.openExternal as (url: string) => Promise<void>)(url);
        expect(mockInvoke).toHaveBeenCalledWith('shell:open-external', url);
      });
    });

    describe('Task Operations', () => {
      it('startTask should invoke task:start with config', async () => {
        const config = { description: 'Test task' };
        await (
          capturedMyBoTeamAPI.startTask as (config: { description: string }) => Promise<unknown>
        )(config);
        expect(mockInvoke).toHaveBeenCalledWith('task:start', config);
      });

      it('cancelTask should invoke task:cancel with taskId', async () => {
        await (capturedMyBoTeamAPI.cancelTask as (taskId: string) => Promise<void>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('task:cancel', 'task_123');
      });

      it('interruptTask should invoke task:interrupt with taskId', async () => {
        await (capturedMyBoTeamAPI.interruptTask as (taskId: string) => Promise<void>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('task:interrupt', 'task_123');
      });

      it('getTask should invoke task:get with taskId', async () => {
        await (capturedMyBoTeamAPI.getTask as (taskId: string) => Promise<unknown>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('task:get', 'task_123');
      });

      it('listTasks should invoke task:list', async () => {
        await (capturedMyBoTeamAPI.listTasks as () => Promise<unknown[]>)();
        expect(mockInvoke).toHaveBeenCalledWith('task:list');
      });

      it('deleteTask should invoke task:delete with taskId', async () => {
        await (capturedMyBoTeamAPI.deleteTask as (taskId: string) => Promise<void>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('task:delete', 'task_123');
      });

      it('clearTaskHistory should invoke task:clear-history', async () => {
        await (capturedMyBoTeamAPI.clearTaskHistory as () => Promise<void>)();
        expect(mockInvoke).toHaveBeenCalledWith('task:clear-history');
      });

      it('addFavorite should invoke favorites:add with taskId', async () => {
        await (capturedMyBoTeamAPI.addFavorite as (taskId: string) => Promise<void>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('favorites:add', 'task_123');
      });

      it('removeFavorite should invoke favorites:remove with taskId', async () => {
        await (capturedMyBoTeamAPI.removeFavorite as (taskId: string) => Promise<void>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('favorites:remove', 'task_123');
      });

      it('listFavorites should invoke favorites:list', async () => {
        await (capturedMyBoTeamAPI.listFavorites as () => Promise<unknown[]>)();
        expect(mockInvoke).toHaveBeenCalledWith('favorites:list');
      });

      it('isFavorite should invoke favorites:has with taskId', async () => {
        await (capturedMyBoTeamAPI.isFavorite as (taskId: string) => Promise<boolean>)('task_123');
        expect(mockInvoke).toHaveBeenCalledWith('favorites:has', 'task_123');
      });
    });

    describe('Permission Operations', () => {
      it('respondToPermission should invoke permission:respond', async () => {
        const response = { taskId: 'task_123', allowed: true };
        await (
          capturedMyBoTeamAPI.respondToPermission as (r: {
            taskId: string;
            allowed: boolean;
          }) => Promise<void>
        )(response);
        expect(mockInvoke).toHaveBeenCalledWith('permission:respond', response);
      });
    });

    describe('Session Operations', () => {
      it('resumeSession should invoke session:resume', async () => {
        await (
          capturedMyBoTeamAPI.resumeSession as (
            s: string,
            p: string,
            t?: string,
            attachments?: unknown[],
          ) => Promise<unknown>
        )('session_123', 'Continue', 'task_456');
        expect(mockInvoke).toHaveBeenCalledWith(
          'session:resume',
          'session_123',
          'Continue',
          'task_456',
          undefined,
        );
      });
    });

    describe('Settings Operations', () => {
      it('getDebugMode should invoke settings:debug-mode', async () => {
        await (capturedMyBoTeamAPI.getDebugMode as () => Promise<boolean>)();
        expect(mockInvoke).toHaveBeenCalledWith('settings:debug-mode');
      });

      it('setDebugMode should invoke settings:set-debug-mode', async () => {
        await (capturedMyBoTeamAPI.setDebugMode as (enabled: boolean) => Promise<void>)(true);
        expect(mockInvoke).toHaveBeenCalledWith('settings:set-debug-mode', true);
      });

      it('getAppSettings should invoke settings:app-settings', async () => {
        await (capturedMyBoTeamAPI.getAppSettings as () => Promise<unknown>)();
        expect(mockInvoke).toHaveBeenCalledWith('settings:app-settings');
      });

      it('getSlackMcpOauthStatus should invoke opencode:auth:slack:status', async () => {
        await (capturedMyBoTeamAPI.getSlackMcpOauthStatus as () => Promise<unknown>)();
        expect(mockInvoke).toHaveBeenCalledWith('opencode:auth:slack:status');
      });

      it('loginSlackMcp should invoke opencode:auth:slack:login', async () => {
        await (capturedMyBoTeamAPI.loginSlackMcp as () => Promise<unknown>)();
        expect(mockInvoke).toHaveBeenCalledWith('opencode:auth:slack:login');
      });

      it('logoutSlackMcp should invoke opencode:auth:slack:logout', async () => {
        await (capturedMyBoTeamAPI.logoutSlackMcp as () => Promise<void>)();
        expect(mockInvoke).toHaveBeenCalledWith('opencode:auth:slack:logout');
      });
    });

    describe('API Key Operations', () => {
      it('hasApiKey should invoke api-key:exists', async () => {
        await (capturedMyBoTeamAPI.hasApiKey as () => Promise<boolean>)();
        expect(mockInvoke).toHaveBeenCalledWith('api-key:exists');
      });

      it('setApiKey should invoke api-key:set', async () => {
        await (capturedMyBoTeamAPI.setApiKey as (key: string) => Promise<void>)('sk-test');
        expect(mockInvoke).toHaveBeenCalledWith('api-key:set', 'sk-test');
      });

      it('getApiKey should invoke api-key:get', async () => {
        await (capturedMyBoTeamAPI.getApiKey as () => Promise<string | null>)();
        expect(mockInvoke).toHaveBeenCalledWith('api-key:get');
      });

      it('validateApiKey should invoke api-key:validate', async () => {
        await (capturedMyBoTeamAPI.validateApiKey as (key: string) => Promise<unknown>)('sk-test');
        expect(mockInvoke).toHaveBeenCalledWith('api-key:validate', 'sk-test');
      });

      it('clearApiKey should invoke api-key:clear', async () => {
        await (capturedMyBoTeamAPI.clearApiKey as () => Promise<void>)();
        expect(mockInvoke).toHaveBeenCalledWith('api-key:clear');
      });

      it('getAllApiKeys should invoke api-keys:all', async () => {
        await (capturedMyBoTeamAPI.getAllApiKeys as () => Promise<unknown>)();
        expect(mockInvoke).toHaveBeenCalledWith('api-keys:all');
      });

      it('hasAnyApiKey should invoke api-keys:has-any', async () => {
        await (capturedMyBoTeamAPI.hasAnyApiKey as () => Promise<boolean>)();
        expect(mockInvoke).toHaveBeenCalledWith('api-keys:has-any');
      });
    });

    describe('Onboarding Operations', () => {
      it('getOnboardingComplete should invoke onboarding:complete', async () => {
        await (capturedMyBoTeamAPI.getOnboardingComplete as () => Promise<boolean>)();
        expect(mockInvoke).toHaveBeenCalledWith('onboarding:complete');
      });

      it('setOnboardingComplete should invoke onboarding:set-complete', async () => {
        await (capturedMyBoTeamAPI.setOnboardingComplete as (c: boolean) => Promise<void>)(true);
        expect(mockInvoke).toHaveBeenCalledWith('onboarding:set-complete', true);
      });
    });

    describe('Model Operations', () => {
      it('getSelectedModel should invoke model:get', async () => {
        await (capturedMyBoTeamAPI.getSelectedModel as () => Promise<unknown>)();
        expect(mockInvoke).toHaveBeenCalledWith('model:get');
      });

      it('setSelectedModel should invoke model:set', async () => {
        const model = { provider: 'anthropic', model: 'claude-3-opus' };
        await (
          capturedMyBoTeamAPI.setSelectedModel as (m: {
            provider: string;
            model: string;
          }) => Promise<void>
        )(model);
        expect(mockInvoke).toHaveBeenCalledWith('model:set', model);
      });
    });

    describe('Logging Operations', () => {
      it('logEvent should invoke log:event', async () => {
        const payload = { level: 'info', message: 'Test' };
        await (capturedMyBoTeamAPI.logEvent as (p: unknown) => Promise<unknown>)(payload);
        expect(mockInvoke).toHaveBeenCalledWith('log:event', payload);
      });
    });

    describe('Skills Operations', () => {
      it('getUserSkillsPath should invoke skills:get-user-skills-path', async () => {
        await (capturedMyBoTeamAPI.getUserSkillsPath as () => Promise<string>)();
        expect(mockInvoke).toHaveBeenCalledWith('skills:get-user-skills-path');
      });
    });
  });

  describe('Event Subscriptions', () => {
    it('onTaskUpdate should subscribe to task:update', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onTaskUpdate as (cb: (e: unknown) => void) => () => void)(callback);
      expect(mockOn).toHaveBeenCalledWith('task:update', expect.any(Function));
    });

    it('onTaskUpdate should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = (
        capturedMyBoTeamAPI.onTaskUpdate as (cb: (e: unknown) => void) => () => void
      )(callback);
      unsubscribe();
      expect(mockRemoveListener).toHaveBeenCalledWith('task:update', expect.any(Function));
    });

    it('onTaskUpdateBatch should subscribe to task:update:batch', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onTaskUpdateBatch as (cb: (e: unknown) => void) => () => void)(callback);
      expect(mockOn).toHaveBeenCalledWith('task:update:batch', expect.any(Function));
    });

    it('onPermissionRequest should subscribe to permission:request', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onPermissionRequest as (cb: (e: unknown) => void) => () => void)(
        callback,
      );
      expect(mockOn).toHaveBeenCalledWith('permission:request', expect.any(Function));
    });

    it('onTaskProgress should subscribe to task:progress', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onTaskProgress as (cb: (e: unknown) => void) => () => void)(callback);
      expect(mockOn).toHaveBeenCalledWith('task:progress', expect.any(Function));
    });

    it('onDebugLog should subscribe to debug:log', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onDebugLog as (cb: (e: unknown) => void) => () => void)(callback);
      expect(mockOn).toHaveBeenCalledWith('debug:log', expect.any(Function));
    });

    it('onTaskStatusChange should subscribe to task:status-change', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onTaskStatusChange as (cb: (e: unknown) => void) => () => void)(
        callback,
      );
      expect(mockOn).toHaveBeenCalledWith('task:status-change', expect.any(Function));
    });
  });

  describe('Event Callback Invocation', () => {
    it('onTaskUpdate callback should receive event data', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onTaskUpdate as (cb: (e: unknown) => void) => () => void)(callback);

      const registeredListener = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'task:update',
      )?.[1] as (event: unknown, data: unknown) => void;

      const eventData = { taskId: 'task_123', type: 'message' };
      registeredListener(null, eventData);

      expect(callback).toHaveBeenCalledWith(eventData);
    });

    it('onPermissionRequest callback should receive request data', () => {
      const callback = vi.fn();
      (capturedMyBoTeamAPI.onPermissionRequest as (cb: (e: unknown) => void) => () => void)(
        callback,
      );

      const registeredListener = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'permission:request',
      )?.[1] as (event: unknown, data: unknown) => void;

      const requestData = { id: 'req_123', taskId: 'task_456' };
      registeredListener(null, requestData);

      expect(callback).toHaveBeenCalledWith(requestData);
    });
  });
});
