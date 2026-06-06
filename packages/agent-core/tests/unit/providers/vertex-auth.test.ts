import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSign = vi.hoisted(() => ({
  update: vi.fn().mockReturnThis(),
  sign: vi.fn(() => 'mock-base64-sig'),
}));

vi.mock('node:crypto', () => ({
  default: {
    createSign: vi.fn(() => mockSign),
  },
  createSign: vi.fn(() => mockSign),
}));

const mockFetch = vi.fn();

import { getVertexAccessToken } from '../../../src/providers/vertex-auth.js';

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getVertexAccessToken', () => {
  it('throws on invalid service account JSON', async () => {
    const promise = getVertexAccessToken({
      authType: 'serviceAccount',
      serviceAccountJson: 'not-json',
    });
    await expect(promise).rejects.toThrow('Invalid service account JSON');
  });

  it('throws on invalid authType', async () => {
    const promise = getVertexAccessToken({
      authType: 'unknown' as never,
    });
    await expect(promise).rejects.toThrow('Unknown authType');
  });

  it('throws when token exchange fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    const promise = getVertexAccessToken({
      authType: 'serviceAccount',
      serviceAccountJson: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'test-key',
        client_email: 'test@test-project.iam.gserviceaccount.com',
      }),
    });

    await expect(promise).rejects.toThrow('Token exchange failed');
  });

  it('throws when no access token in exchange response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const promise = getVertexAccessToken({
      authType: 'serviceAccount',
      serviceAccountJson: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'test-key',
        client_email: 'test@test-project.iam.gserviceaccount.com',
      }),
    });

    await expect(promise).rejects.toThrow('No access token in response');
  });
});
