import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('getMyBoTeam - Vertex AI helpers', () => {
  const mockApi = {
    getVersion: vi.fn(),
    validateVertexCredentials: vi.fn().mockResolvedValue({ valid: true }),
    saveVertexCredentials: vi.fn().mockResolvedValue({ id: 'cfg1' }),
    getVertexCredentials: vi.fn().mockResolvedValue({ projectId: 'proj1' }),
    fetchVertexModels: vi.fn().mockReturnValue(['model1']),
    detectVertexProject: vi.fn().mockResolvedValue('proj1'),
    listVertexProjects: vi.fn().mockResolvedValue(['proj1', 'proj2']),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      myboteam: mockApi,
    };
  });

  afterEach(() => {
    (globalThis as unknown as { window: typeof window }).window = originalWindow;
  });

  it('validateVertexCredentials serializes and calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().validateVertexCredentials({
      clientEmail: 'test@test.com',
      privateKey: 'key',
      projectId: 'proj1',
    });
    expect(mockApi.validateVertexCredentials).toHaveBeenCalledWith(
      JSON.stringify({ clientEmail: 'test@test.com', privateKey: 'key', projectId: 'proj1' }),
    );
    expect(result).toEqual({ valid: true });
  });

  it('saveVertexCredentials serializes and calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().saveVertexCredentials({
      clientEmail: 'test@test.com',
      privateKey: 'key',
      projectId: 'proj1',
    });
    expect(result).toEqual({ id: 'cfg1' });
  });

  it('getVertexCredentials calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().getVertexCredentials();
    expect(result).toEqual({ projectId: 'proj1' });
  });

  it('fetchVertexModels calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = getMyBoTeam().fetchVertexModels('creds');
    expect(mockApi.fetchVertexModels).toHaveBeenCalledWith('creds');
    expect(result).toEqual(['model1']);
  });

  it('detectVertexProject calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().detectVertexProject();
    expect(mockApi.detectVertexProject).toHaveBeenCalled();
    expect(result).toBe('proj1');
  });

  it('listVertexProjects calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().listVertexProjects();
    expect(mockApi.listVertexProjects).toHaveBeenCalled();
    expect(result).toEqual(['proj1', 'proj2']);
  });
});
