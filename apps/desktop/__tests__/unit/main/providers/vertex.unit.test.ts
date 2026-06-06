import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/ipc/validation', () => ({
  normalizeIpcError: vi.fn((e) => (e instanceof Error ? e.message : String(e))),
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ log: vi.fn() })),
}));

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
  storeApiKey: vi.fn(),
}));

const mockExecFile = vi.hoisted(() => vi.fn());
const mockValidateVertexCredentials = vi.hoisted(() => vi.fn());
const mockFetchVertexModels = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}));

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  validateVertexCredentials: mockValidateVertexCredentials,
  fetchVertexModels: mockFetchVertexModels,
}));

import { registerVertexHandlers } from '@main/providers/vertex';
import { getApiKey, storeApiKey } from '@main/store/secureStorage';
import type { IpcMainInvokeEvent } from 'electron';

describe('Vertex IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        _opts: object,
        cb: (error: Error, stdout: string, stderr: string) => void,
      ) => {
        cb(new Error('gcloud not found'), '', '');
      },
    );
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    registerVertexHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  describe('vertex:validate', () => {
    it('should call validateVertexCredentials', async () => {
      mockValidateVertexCredentials.mockResolvedValue({ success: true });
      const result = await handlers['vertex:validate']({} as IpcMainInvokeEvent, 'creds-json');
      expect(mockValidateVertexCredentials).toHaveBeenCalledWith('creds-json');
      expect(result).toEqual({ success: true });
    });
  });

  describe('vertex:fetch-models', () => {
    it('should parse credentials and fetch models', async () => {
      mockFetchVertexModels.mockResolvedValue({ success: true, models: ['model-1'] });
      const result = await handlers['vertex:fetch-models'](
        {} as IpcMainInvokeEvent,
        JSON.stringify({ projectId: 'proj-1' }),
      );
      expect(mockFetchVertexModels).toHaveBeenCalledWith({ projectId: 'proj-1' });
      expect(result).toEqual({ success: true, models: ['model-1'] });
    });

    it('should normalize errors', async () => {
      const testError = new Error('API error');
      mockFetchVertexModels.mockResolvedValue({ success: false, error: testError, models: [] });
      const result = await handlers['vertex:fetch-models'](
        {} as IpcMainInvokeEvent,
        JSON.stringify({}),
      );
      expect(result).toEqual({ success: false, error: 'API error', models: [] });
    });

    it('should handle catch errors', async () => {
      mockFetchVertexModels.mockRejectedValue(new Error('Network error'));
      const result = await handlers['vertex:fetch-models'](
        {} as IpcMainInvokeEvent,
        JSON.stringify({}),
      );
      expect(result).toEqual({ success: false, error: 'Network error', models: [] });
    });
  });

  describe('vertex:save', () => {
    it('should save service account credentials', async () => {
      const creds = {
        projectId: 'proj-1',
        location: 'us-central1',
        authType: 'serviceAccount',
        serviceAccountJson: '{"type":"service_account"}',
      };
      const result = await handlers['vertex:save']({} as IpcMainInvokeEvent, JSON.stringify(creds));
      expect(storeApiKey).toHaveBeenCalledWith('vertex', JSON.stringify(creds));
      expect(result).toEqual({
        id: 'local-vertex',
        provider: 'vertex',
        label: 'Service Account',
        keyPrefix: 'proj-1 (us-central1)',
        isActive: true,
        createdAt: expect.any(String),
      });
    });

    it('should save ADC credentials', async () => {
      const creds = {
        projectId: 'proj-2',
        location: 'europe-west1',
        authType: 'adc',
      };
      const result = await handlers['vertex:save']({} as IpcMainInvokeEvent, JSON.stringify(creds));
      expect(result.label).toBe('Application Default Credentials');
    });

    it('should throw when project ID is missing', async () => {
      const creds = { projectId: '', location: 'us-central1', authType: 'adc' };
      await expect(
        handlers['vertex:save']({} as IpcMainInvokeEvent, JSON.stringify(creds)),
      ).rejects.toThrow('Project ID is required');
    });

    it('should throw when location is missing', async () => {
      const creds = { projectId: 'proj-1', location: '', authType: 'adc' };
      await expect(
        handlers['vertex:save']({} as IpcMainInvokeEvent, JSON.stringify(creds)),
      ).rejects.toThrow('Location is required');
    });

    it('should throw when service account key is missing', async () => {
      const creds = {
        projectId: 'proj-1',
        location: 'us-central1',
        authType: 'serviceAccount',
        serviceAccountJson: '',
      };
      await expect(
        handlers['vertex:save']({} as IpcMainInvokeEvent, JSON.stringify(creds)),
      ).rejects.toThrow('Service account JSON key is required');
    });
  });

  describe('vertex:get-credentials', () => {
    it('should return parsed credentials', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify({ projectId: 'proj-1' }),
      );
      const result = await handlers['vertex:get-credentials']({} as IpcMainInvokeEvent);
      expect(result).toEqual({ projectId: 'proj-1' });
    });

    it('should return null when no stored credentials', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await handlers['vertex:get-credentials']({} as IpcMainInvokeEvent);
      expect(result).toBeNull();
    });

    it('should return null on parse error', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('invalid-json');
      const result = await handlers['vertex:get-credentials']({} as IpcMainInvokeEvent);
      expect(result).toBeNull();
    });
  });

  describe('vertex:detect-project', () => {
    beforeEach(() => {
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.CLOUDSDK_CORE_PROJECT;
      delete process.env.GCLOUD_PROJECT;
    });

    it('should return project from GOOGLE_CLOUD_PROJECT env', async () => {
      process.env.GOOGLE_CLOUD_PROJECT = 'env-proj';
      const result = await handlers['vertex:detect-project']({} as IpcMainInvokeEvent);
      expect(result).toEqual({ success: true, projectId: 'env-proj' });
    });

    it('should return project from CLOUDSDK_CORE_PROJECT env', async () => {
      process.env.CLOUDSDK_CORE_PROJECT = 'sdk-proj';
      const result = await handlers['vertex:detect-project']({} as IpcMainInvokeEvent);
      expect(result).toEqual({ success: true, projectId: 'sdk-proj' });
    });

    it('should return project from GCLOUD_PROJECT env', async () => {
      process.env.GCLOUD_PROJECT = 'gcloud-proj';
      const result = await handlers['vertex:detect-project']({} as IpcMainInvokeEvent);
      expect(result).toEqual({ success: true, projectId: 'gcloud-proj' });
    });

    it('should return failure when no project found', async () => {
      const result = await handlers['vertex:detect-project']({} as IpcMainInvokeEvent);
      expect(result).toEqual({ success: false, projectId: null });
    });
  });

  describe('vertex:list-projects', () => {
    it('should return failure when gcloud returns no token', async () => {
      const result = await handlers['vertex:list-projects']({} as IpcMainInvokeEvent);
      expect(result.success).toBe(false);
      expect(result.projects).toEqual([]);
    });
  });
});
