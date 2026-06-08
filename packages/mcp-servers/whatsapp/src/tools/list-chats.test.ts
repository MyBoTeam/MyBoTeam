import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { listChatsToolHandler } from './list-chats.js';

describe('ListWhatsAppChats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no chats found when empty', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, chats: [] });
    const result = await listChatsToolHandler({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', 'No chats found');
  });

  it('formats chat list response', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      chats: [
        {
          jid: '+1@s.whatsapp.net',
          name: 'Alice',
          lastMessageAt: 1000000,
        },
      ],
    });
    const result = await listChatsToolHandler({});
    expect(result.content[0]).toHaveProperty(
      'text',
      expect.stringContaining('JID: +1@s.whatsapp.net'),
    );
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('Name: Alice'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: false,
      error: 'not connected',
    });
    const result = await listChatsToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('not connected'));
  });
});
