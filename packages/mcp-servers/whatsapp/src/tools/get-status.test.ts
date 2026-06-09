import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { getStatusToolHandler } from './get-status.js';

describe('GetWhatsAppStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns formatted status', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      config: {
        status: 'connected',
        phoneNumber: '+15551234567',
      },
    });
    const result = await getStatusToolHandler({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('connected'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('+15551234567'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'not connected',
    });
    const result = await getStatusToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('not connected'));
  });
});
