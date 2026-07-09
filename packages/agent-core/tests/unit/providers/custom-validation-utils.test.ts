import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkUniqueness,
  validateApiFormat,
  validateModelInList,
} from '../../../src/providers/tools/custom-validation-utils.js';

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

describe('custom-validation-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('validateApiFormat', () => {
    it('should return valid for successful /v1/models response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await validateApiFormat('https://api.example.com/v1', 'sk-key');

      expect(result.valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-key',
          }),
        }),
      );
    });

    it('should return invalid for 401 response (endpoint exists, auth required)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await validateApiFormat('https://api.example.com/v1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTH_FAILED');
      expect(result.error).toContain('401');
    });

    it('should return invalid for 403 response (endpoint exists, auth required)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await validateApiFormat('https://api.example.com/v1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('AUTH_FAILED');
      expect(result.error).toContain('403');
    });

    it('should return invalid for non-OpenAI endpoint (404)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await validateApiFormat('https://api.example.com/v1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API_FORMAT_INVALID');
      expect(result.error).toContain('404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'));

      const result = await validateApiFormat('https://api.example.com/v1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('NETWORK_ERROR');
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await validateApiFormat('https://api.example.com/v1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('NETWORK_TIMEOUT');
    });
  });

  describe('validateModelInList', () => {
    it('should return valid when model exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-4', object: 'model' },
            { id: 'gpt-3.5-turbo', object: 'model' },
          ],
        }),
      });

      const result = await validateModelInList('https://api.example.com/v1', 'gpt-4', 'sk-key');

      expect(result.valid).toBe(true);
      expect(result.availableModels).toEqual(['gpt-4', 'gpt-3.5-turbo']);
    });

    it('should return invalid when model does not exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-4', object: 'model' },
            { id: 'gpt-3.5-turbo', object: 'model' },
          ],
        }),
      });

      const result = await validateModelInList('https://api.example.com/v1', 'claude-3', 'sk-key');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MODEL_NOT_IN_LIST');
      expect(result.error).toContain('claude-3');
      expect(result.availableModels).toEqual(['gpt-4', 'gpt-3.5-turbo']);
    });

    it('should handle empty models list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] }),
      });

      const result = await validateModelInList('https://api.example.com/v1', 'gpt-4');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MODEL_NOT_IN_LIST');
      expect(result.error).toContain('none found');
      expect(result.availableModels).toEqual([]);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await validateModelInList('https://api.example.com/v1', 'gpt-4');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'));

      const result = await validateModelInList('https://api.example.com/v1', 'gpt-4');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('NETWORK_ERROR');
    });
  });

  describe('checkUniqueness', () => {
    const mockProviders = [
      {
        key: 'custom-provider:1',
        metadata: { name: 'Provider 1', url: 'https://api1.example.com/v1' },
      },
      {
        key: 'custom-provider:2',
        metadata: { name: 'Provider 2', url: 'https://api2.example.com/v1' },
      },
    ];

    it('should return null when name and URL are unique', () => {
      const result = checkUniqueness(
        mockProviders as any,
        '',
        'New Provider',
        'https://api3.example.com/v1',
      );

      expect(result).toBeNull();
    });

    it('should return error when name already exists', () => {
      const result = checkUniqueness(
        mockProviders as any,
        '',
        'Provider 1',
        'https://api3.example.com/v1',
      );

      expect(result).toContain('PROVIDER_NAME_EXISTS');
    });

    it('should return error when URL already exists', () => {
      const result = checkUniqueness(
        mockProviders as any,
        '',
        'New Provider',
        'https://api1.example.com/v1',
      );

      expect(result).toContain('PROVIDER_URL_EXISTS');
    });

    it('should exclude specified key from check (for updates)', () => {
      const result = checkUniqueness(
        mockProviders as any,
        'custom-provider:1',
        'Provider 1',
        'https://api1.example.com/v1',
      );

      expect(result).toBeNull();
    });
  });
});
