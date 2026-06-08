import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { markReadToolHandler } from './mark-read.js';

describe('MarkWhatsAppRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates chatJid is required', async () => {
    const result = await markReadToolHandler({ messageIds: ['msg-1'] });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('chatJid'));
  });

  it('validates messageIds must be a non-empty array', async () => {
    const result = await markReadToolHandler({ chatJid: 'jid', messageIds: [] });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('messageIds'));
  });

  it('calls API on valid input', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true });
    const result = await markReadToolHandler({ chatJid: 'jid', messageIds: ['msg-1', 'msg-2'] });
    expect(callApi).toHaveBeenCalledWith('/mark-read', {
      chatJid: 'jid',
      messageIds: ['msg-1', 'msg-2'],
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty(
      'text',
      expect.stringContaining('Marked 2 message(s) as read in jid'),
    );
  });
});
