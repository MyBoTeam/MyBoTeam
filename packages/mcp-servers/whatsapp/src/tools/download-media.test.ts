import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { downloadMediaToolHandler } from './download-media.js';

describe('DownloadWhatsAppMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates chatJid is required', async () => {
    const result = await downloadMediaToolHandler({ messageId: 'msg-1' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('chatJid'));
  });

  it('validates messageId is required', async () => {
    const result = await downloadMediaToolHandler({ chatJid: 'jid' });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('messageId'));
  });

  it('calls API on valid input and returns file path and mime type', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      filePath: '/tmp/media.jpg',
      mimeType: 'image/jpeg',
    });
    const result = await downloadMediaToolHandler({ chatJid: 'jid', messageId: 'msg-1' });
    expect(callApi).toHaveBeenCalledWith('/download-media', { chatJid: 'jid', messageId: 'msg-1' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('/tmp/media.jpg'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('image/jpeg'));
  });
});
