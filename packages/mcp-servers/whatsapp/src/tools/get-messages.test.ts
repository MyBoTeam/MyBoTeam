import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { getMessagesToolHandler } from './get-messages.js';

describe('GetWhatsAppMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates jid is required', async () => {
    const result = await getMessagesToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('jid'));
  });

  it('returns no messages found when empty', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, messages: [] });
    const result = await getMessagesToolHandler({
      jid: '+1@s.whatsapp.net',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', 'No messages found');
  });

  it('formats messages response', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      messages: [{ fromMe: true, text: 'Hello', timestamp: 1000000, senderJid: '+1' }],
    });
    const result = await getMessagesToolHandler({
      jid: '+1@s.whatsapp.net',
    });
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('me'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('Hello'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'API error',
    });
    const result = await getMessagesToolHandler({ jid: '+1' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('API error'));
  });
});
