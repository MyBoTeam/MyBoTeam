import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({
  call: vi.fn(),
}));

const mockStartServer = vi.hoisted(() => vi.fn());
const mockStopServer = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockGetStatus = vi.hoisted(() => vi.fn());
const mockTestConnection = vi.hoisted(() => vi.fn());
const mockDeleteModel = vi.hoisted(() => vi.fn());
const mockDownloadModel = vi.hoisted(() => vi.fn());
const mockGetCachePath = vi.hoisted(() => vi.fn(() => '/cache'));
const mockListCached = vi.hoisted(() => vi.fn());

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
}));

vi.mock('@main/providers/huggingface-local', () => ({
  startHuggingFaceServer: mockStartServer,
  stopHuggingFaceServer: mockStopServer,
  getHuggingFaceServerStatus: mockGetStatus,
  testHuggingFaceConnection: mockTestConnection,
  deleteHuggingFaceModel: mockDeleteModel,
  HF_RECOMMENDED_MODELS: [{ id: 'model-1' }],
}));

vi.mock('@main/providers/huggingface-local/model-manager', () => ({
  downloadModel: mockDownloadModel,
  getCachePath: mockGetCachePath,
  listCachedModels: mockListCached,
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerHuggingFaceHandlers } from '@main/ipc/handlers/huggingface-handlers';

describe('huggingface-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    registerHuggingFaceHandlers();
  });

  describe('huggingface-local:start-server', () => {
    it('should start server with valid model ID', async () => {
      mockStartServer.mockResolvedValue({ success: true });
      const result = await handlers['huggingface-local:start-server']({} as unknown, 'model-1');
      expect(mockStartServer).toHaveBeenCalledWith('model-1');
      expect(result).toEqual({ success: true });
    });

    it('should return error for empty model ID', async () => {
      const result = await handlers['huggingface-local:start-server']({} as unknown, '');
      expect(result).toEqual({ success: false, error: 'Invalid model ID' });
    });

    it('should return error for non-string model ID', async () => {
      const result = await handlers['huggingface-local:start-server']({} as unknown, 123);
      expect(result).toEqual({ success: false, error: 'Invalid model ID' });
    });
  });

  describe('huggingface-local:stop-server', () => {
    it('should stop server', async () => {
      const result = await handlers['huggingface-local:stop-server']();
      expect(mockStopServer).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('huggingface-local:server-status', () => {
    it('should return server status', async () => {
      mockGetStatus.mockReturnValue({ running: true });
      const result = await handlers['huggingface-local:server-status']();
      expect(result).toEqual({ running: true });
    });
  });

  describe('huggingface-local:test-connection', () => {
    it('should test connection', async () => {
      mockTestConnection.mockResolvedValue({ ok: true });
      const result = await handlers['huggingface-local:test-connection']();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('huggingface-local:download-model', () => {
    it('should download model with progress callback', async () => {
      mockDownloadModel.mockResolvedValue({ success: true });
      const sender = { send: vi.fn() };
      const result = await handlers['huggingface-local:download-model'](
        { sender } as unknown,
        'model-1',
      );
      expect(mockDownloadModel).toHaveBeenCalledWith('model-1', expect.any(Function), '/cache');
      expect(result).toEqual({ success: true });
    });

    it('should return error for empty model ID', async () => {
      const result = await handlers['huggingface-local:download-model'](
        { sender: { send: vi.fn() } } as unknown,
        '',
      );
      expect(result).toEqual({ success: false, error: 'Invalid model ID' });
    });
  });

  describe('huggingface-local:list-models', () => {
    it('should return cached and suggested models', async () => {
      mockListCached.mockResolvedValue(['model-1']);
      const result = await handlers['huggingface-local:list-models']();
      expect(result).toEqual({ cached: ['model-1'], suggested: [{ id: 'model-1' }] });
    });
  });

  describe('huggingface-local:delete-model', () => {
    it('should stop server before deleting model', async () => {
      mockDeleteModel.mockResolvedValue({ success: true });
      const result = await handlers['huggingface-local:delete-model']({} as unknown, 'model-1');
      expect(mockStopServer).toHaveBeenCalled();
      expect(mockDeleteModel).toHaveBeenCalledWith('model-1');
      expect(result).toEqual({ success: true });
    });

    it('should return error for empty model ID', async () => {
      const result = await handlers['huggingface-local:delete-model']({} as unknown, '');
      expect(result).toEqual({ success: false, error: 'Invalid model ID' });
    });

    it('should handle stop server error gracefully', async () => {
      mockStopServer.mockRejectedValue(new Error('Stop failed'));
      mockDeleteModel.mockResolvedValue({ success: true });
      const result = await handlers['huggingface-local:delete-model']({} as unknown, 'model-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('huggingface-local:get-config', () => {
    it('should get config from daemon', async () => {
      mockDaemonClient.call.mockResolvedValue({ enabled: true });
      const result = await handlers['huggingface-local:get-config']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.getHuggingFaceLocalConfig');
      expect(result).toEqual({ enabled: true });
    });
  });

  describe('huggingface-local:set-config', () => {
    it('should set config via daemon', async () => {
      const config = {
        enabled: true,
        selectedModelId: null,
        serverPort: 8080,
        quantization: null,
        devicePreference: null,
      };
      await handlers['huggingface-local:set-config']({} as unknown, config);
      expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.setHuggingFaceLocalConfig', {
        config,
      });
    });

    it('should accept null config', async () => {
      await handlers['huggingface-local:set-config']({} as unknown, null);
      expect(mockDaemonClient.call).toHaveBeenCalledWith('provider.setHuggingFaceLocalConfig', {
        config: null,
      });
    });

    it('should throw for invalid config', async () => {
      const invalid = {
        enabled: 'not-boolean',
        selectedModelId: null,
        serverPort: null,
        quantization: null,
        devicePreference: null,
      };
      await expect(
        handlers['huggingface-local:set-config']({} as unknown, invalid),
      ).rejects.toThrow('Invalid HuggingFace config');
    });

    it('should throw for invalid serverPort', async () => {
      const invalid = {
        enabled: true,
        selectedModelId: null,
        serverPort: 99999,
        quantization: null,
        devicePreference: null,
      };
      await expect(
        handlers['huggingface-local:set-config']({} as unknown, invalid),
      ).rejects.toThrow('Invalid HuggingFace config');
    });

    it('should throw for invalid quantization', async () => {
      const invalid = {
        enabled: true,
        selectedModelId: null,
        serverPort: null,
        quantization: 'q8',
        devicePreference: null,
      };
      await expect(
        handlers['huggingface-local:set-config']({} as unknown, invalid),
      ).rejects.toThrow('Invalid HuggingFace config');
    });

    it('should throw for invalid devicePreference', async () => {
      const invalid = {
        enabled: true,
        selectedModelId: null,
        serverPort: null,
        quantization: null,
        devicePreference: 'invalid',
      };
      await expect(
        handlers['huggingface-local:set-config']({} as unknown, invalid),
      ).rejects.toThrow('Invalid HuggingFace config');
    });
  });
});
