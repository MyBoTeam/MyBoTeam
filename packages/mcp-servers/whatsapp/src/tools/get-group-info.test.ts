import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { getGroupInfoToolHandler } from './get-group-info.js';

describe('GetWhatsAppGroupInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates groupJid is required', async () => {
    const result = await getGroupInfoToolHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('groupJid'));
  });

  it('returns response with participants', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      group: {
        name: 'Test Group',
        jid: 'jid-1',
        participants: [{ id: 'user-1', admin: 'admin' }, { id: 'user-2' }],
      },
    });
    const result = await getGroupInfoToolHandler({ groupJid: 'jid-1' });
    expect(callApi).toHaveBeenCalledWith('/group-info', { groupJid: 'jid-1' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('Name: Test Group'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('user-1'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('user-2'));
    expect(result.content[0]).toHaveProperty('text', expect.stringContaining('(admin)'));
  });
});
