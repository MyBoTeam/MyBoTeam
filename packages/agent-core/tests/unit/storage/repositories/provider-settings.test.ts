import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
}));

import {
  getAzureFoundryConfig,
  getHuggingFaceLocalConfig,
  getLiteLLMConfig,
  getLMStudioConfig,
  getNimConfig,
  getOllamaConfig,
  getOpenAiBaseUrl,
  getSelectedModel,
  setAzureFoundryConfig,
  setHuggingFaceLocalConfig,
  setLiteLLMConfig,
  setLMStudioConfig,
  setNimConfig,
  setOllamaConfig,
  setOpenAiBaseUrl,
  setSelectedModel,
} from '../../../../src/storage/repositories/provider-settings.js';

function makeRow(overrides: Record<string, string | null> = {}) {
  return {
    selected_model: null,
    ollama_config: null,
    litellm_config: null,
    azure_foundry_config: null,
    lmstudio_config: null,
    huggingface_local_config: null,
    openai_base_url: '',
    nim_config: null,
    ...overrides,
  };
}

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('provider-settings repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSelectedModel', () => {
    it('returns null when no model is selected', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getSelectedModel()).toBeNull();
    });

    it('returns parsed selected model', () => {
      const model = { provider: 'ollama', modelId: 'llama3' };
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ selected_model: JSON.stringify(model) })));
      expect(getSelectedModel()).toEqual(model);
    });
  });

  describe('setSelectedModel', () => {
    it('serializes and stores the model', () => {
      const model = { provider: 'ollama' as const, modelId: 'llama3' };
      setSelectedModel(model);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify(model),
      ]);
    });
  });

  describe('getOllamaConfig', () => {
    it('returns null when no config stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getOllamaConfig()).toBeNull();
    });

    it('returns parsed config', () => {
      const config = { baseUrl: 'http://localhost:11434' };
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ ollama_config: JSON.stringify(config) })));
      expect(getOllamaConfig()).toEqual(config);
    });
  });

  describe('setOllamaConfig', () => {
    it('stores JSON-serialized config', () => {
      setOllamaConfig({ baseUrl: 'http://localhost:11434' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ baseUrl: 'http://localhost:11434' }),
      ]);
    });

    it('stores null', () => {
      setOllamaConfig(null);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        null,
      ]);
    });
  });

  describe('getLiteLLMConfig', () => {
    it('returns null when none stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getLiteLLMConfig()).toBeNull();
    });

    it('returns parsed config', () => {
      const config = { baseUrl: 'http://localhost:8000' };
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ litellm_config: JSON.stringify(config) })));
      expect(getLiteLLMConfig()).toEqual(config);
    });
  });

  describe('setLiteLLMConfig', () => {
    it('stores config', () => {
      setLiteLLMConfig({ baseUrl: 'http://localhost:8000' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ baseUrl: 'http://localhost:8000' }),
      ]);
    });
  });

  describe('getAzureFoundryConfig', () => {
    it('returns null when none stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getAzureFoundryConfig()).toBeNull();
    });
  });

  describe('setAzureFoundryConfig', () => {
    it('stores config as JSON', () => {
      setAzureFoundryConfig({ endpoint: 'https://example.com', apiKey: 'key' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ endpoint: 'https://example.com', apiKey: 'key' }),
      ]);
    });
  });

  describe('getLMStudioConfig', () => {
    it('returns null when none stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getLMStudioConfig()).toBeNull();
    });
  });

  describe('setLMStudioConfig', () => {
    it('stores config as JSON', () => {
      setLMStudioConfig({ baseUrl: 'http://localhost:1234' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ baseUrl: 'http://localhost:1234' }),
      ]);
    });
  });

  describe('getHuggingFaceLocalConfig', () => {
    it('returns null when none stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getHuggingFaceLocalConfig()).toBeNull();
    });
  });

  describe('setHuggingFaceLocalConfig', () => {
    it('stores config as JSON', () => {
      setHuggingFaceLocalConfig({ baseUrl: 'http://localhost:8080' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ baseUrl: 'http://localhost:8080' }),
      ]);
    });
  });

  describe('getNimConfig', () => {
    it('returns null when none stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow()));
      expect(getNimConfig()).toBeNull();
    });
  });

  describe('setNimConfig', () => {
    it('stores config as JSON', () => {
      setNimConfig({ baseUrl: 'http://localhost:8000' });
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        JSON.stringify({ baseUrl: 'http://localhost:8000' }),
      ]);
    });
  });

  describe('getOpenAiBaseUrl', () => {
    it('returns openai base url', () => {
      mockDb.exec.mockReturnValueOnce(
        qResult(makeRow({ openai_base_url: 'https://api.openai.com/v1' })),
      );
      expect(getOpenAiBaseUrl()).toBe('https://api.openai.com/v1');
    });

    it('returns empty string when null', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ openai_base_url: null })));
      expect(getOpenAiBaseUrl()).toBe('');
    });
  });

  describe('setOpenAiBaseUrl', () => {
    it('stores the base url', () => {
      setOpenAiBaseUrl('https://api.openai.com/v1');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        'https://api.openai.com/v1',
      ]);
    });

    it('stores empty string for falsy input', () => {
      setOpenAiBaseUrl('');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), ['']);
    });
  });
});
