import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { sendReactionToolHandler } from './send-reaction.js';

describe('SendWhatsAppReaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates chatJid is required', async () => {
    const result = await sendReactionToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('chatJid'));
  });

  it('validates messageId is required', async () => {
    const result = await sendReactionToolHandler({
      chatJid: '+15551234567@g.us',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('messageId'));
  });

  it('validates emoji is required', async () => {
    const result = await sendReactionToolHandler({
      chatJid: '+15551234567@g.us',
      messageId: 'msg-1',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('emoji'));
  });

  it('calls API on valid input', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, messageId: 'r-1' });
    const result = await sendReactionToolHandler({
      chatJid: '+15551234567@g.us',
      messageId: 'msg-1',
      emoji: '👍',
    });
    expect(callApi).toHaveBeenCalledWith('/send-reaction', {
      chatJid: '+15551234567@g.us',
      messageId: 'msg-1',
      emoji: '👍',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('sent'));
  });

  it('handles API error', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: false, error: 'API error' });
    const result = await sendReactionToolHandler({
      chatJid: '+1',
      messageId: 'm1',
      emoji: '❤️',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('API error'));
  });
});
