import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { logoutToolHandler } from './logout.js';

describe('LogoutWhatsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls logout API', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true });
    const result = await logoutToolHandler({});
    expect(callApi).toHaveBeenCalledWith('/logout', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('Logged out'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'not connected',
    });
    const result = await logoutToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('not connected'));
  });
});
