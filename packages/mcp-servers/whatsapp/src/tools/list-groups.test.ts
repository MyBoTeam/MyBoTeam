import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api-client.js', () => ({ callApi: vi.fn() }));

import { callApi } from '../api-client.js';
import { listGroupsToolHandler } from './list-groups.js';

describe('ListWhatsAppGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no groups found for empty response', async () => {
    vi.mocked(callApi).mockResolvedValue({ success: true, groups: [] });
    const result = await listGroupsToolHandler({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty('text', 'No groups found');
  });

  it('formats response with groups', async () => {
    vi.mocked(callApi).mockResolvedValue({
      success: true,
      groups: [
        { name: 'Group A', jid: 'jid-1', participants: 5 },
        { jid: 'jid-2', participants: 3 },
      ],
    });
    const result = await listGroupsToolHandler({ limit: 10 });
    expect(callApi).toHaveBeenCalledWith('/groups', { limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toHaveProperty(
      'text',
      expect.stringContaining('Name: Group A | JID: jid-1 | Participants: 5'),
    );
    expect(result.content[0]).toHaveProperty(
      'text',
      expect.stringContaining('Name: (no name) | JID: jid-2 | Participants: 3'),
    );
  });
});
