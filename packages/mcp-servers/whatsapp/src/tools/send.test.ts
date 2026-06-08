import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { sendToolHandler } from './send.js';

describe('SendWhatsAppMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields', async () => {
    const result = await sendToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('recipient'));
  });

  it('validates message is required', async () => {
    const result = await sendToolHandler({ recipient: '+1' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('message'));
  });

  it('calls API on valid input', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, messageId: 'msg-1' });
    const result = await sendToolHandler({
      recipient: '+15551234567',
      message: 'Hello',
    });
    expect(callApi).toHaveBeenCalledWith('/send', {
      recipient: '+15551234567',
      message: 'Hello',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('sent'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: false, error: 'not connected' });
    const result = await sendToolHandler({ recipient: '+1', message: 'hi' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('not connected'));
  });
});
