import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('callApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws when MYBOTEAM_WHATSAPP_API_PORT is not set', async () => {
    const oldPort = process.env.MYBOTEAM_WHATSAPP_API_PORT;
    try {
      delete process.env.MYBOTEAM_WHATSAPP_API_PORT;
      const { callApi } = await import('./api-client.js');
      await expect(callApi('/test', {})).rejects.toThrow('MYBOTEAM_WHATSAPP_API_PORT');
    } finally {
      if (oldPort) process.env.MYBOTEAM_WHATSAPP_API_PORT = oldPort;
    }
  });

  it('calls fetch with correct URL and headers', async () => {
    process.env.MYBOTEAM_WHATSAPP_API_PORT = '9230';
    delete process.env.MYBOTEAM_DAEMON_AUTH_TOKEN;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);
    const { callApi } = await import('./api-client.js');
    const result = await callApi('/send', { recipient: '+1' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9230/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ recipient: '+1' }),
      }),
    );
    expect(result.success).toBe(true);
  });
});
