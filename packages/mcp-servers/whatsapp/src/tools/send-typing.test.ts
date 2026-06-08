import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { sendTypingToolHandler } from './send-typing.js';

describe('SendWhatsAppTyping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates recipient is required', async () => {
    const result = await sendTypingToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('recipient'));
  });

  it('calls API on valid input', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true });
    const result = await sendTypingToolHandler({
      recipient: '+15551234567',
    });
    expect(callApi).toHaveBeenCalledWith('/send-typing', {
      recipient: '+15551234567',
      action: 'composing',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('sent'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'not connected',
    });
    const result = await sendTypingToolHandler({ recipient: '+1' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('not connected'));
  });
});
