import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

globalThis.fetch = mockFetch as unknown as typeof fetch;

const { ProviderDiscovery } = await import('../../../src/providers/tools/provider-discovery');

describe('Provider Discovery Contract', () => {
  let discovery: InstanceType<typeof ProviderDiscovery>;

  beforeEach(() => {
    vi.clearAllMocks();
    discovery = new ProviderDiscovery();
  });

  describe('ProviderDiscovery interface compliance', () => {
    it('should implement discover method', () => {
      expect(typeof discovery.discover).toBe('function');
    });

    it('should implement scanPort method', () => {
      expect(typeof discovery.scanPort).toBe('function');
    });
  });

  describe('discover contract', () => {
    it('should return array of DiscoveredProvider', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const providers = await discovery.discover();

      expect(Array.isArray(providers)).toBe(true);
    });

    it('should detect Ollama on port 11434', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('11434')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ id: 'llama3', object: 'model' }] }),
          });
        }
        return Promise.reject(new Error('Connection refused'));
      });

      const providers = await discovery.discover();

      const ollama = providers.find((p) => p.type === 'ollama');
      expect(ollama).toBeDefined();
      expect(ollama?.port).toBe(11434);
      expect(ollama?.available).toBe(true);
    });

    it('should detect LMStudio on port 1234', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('1234')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ id: 'mistral-7b', object: 'model' }] }),
          });
        }
        return Promise.reject(new Error('Connection refused'));
      });

      const providers = await discovery.discover();

      const lmstudio = providers.find((p) => p.type === 'lmstudio');
      expect(lmstudio).toBeDefined();
      expect(lmstudio?.port).toBe(1234);
      expect(lmstudio?.available).toBe(true);
    });

    it('should handle no providers found', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const providers = await discovery.discover();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBe(0);
    });
  });

  describe('scanPort contract', () => {
    it('should return DiscoveredProvider for valid port', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'llama3', object: 'model' }] }),
      });

      const result = await discovery.scanPort(11434, 'ollama');

      expect(result).toBeDefined();
      expect(result?.type).toBe('ollama');
      expect(result?.port).toBe(11434);
      expect(result?.available).toBe(true);
    });

    it('should return null for invalid port', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await discovery.scanPort(9999, 'ollama');

      expect(result).toBeNull();
    });
  });
});
