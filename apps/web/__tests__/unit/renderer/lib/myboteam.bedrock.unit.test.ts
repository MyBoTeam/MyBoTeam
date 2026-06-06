import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('getMyBoTeam - Bedrock helpers', () => {
  const mockApi = {
    getVersion: vi.fn(),
    validateBedrockCredentials: vi.fn().mockResolvedValue({ valid: true }),
    saveBedrockCredentials: vi.fn().mockResolvedValue({ id: 'cfg1' }),
    getBedrockCredentials: vi.fn().mockResolvedValue({ accessKey: 'ak' }),
    fetchBedrockModels: vi.fn().mockReturnValue(['model1']),
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

  it('validateBedrockCredentials serializes and calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().validateBedrockCredentials({
      accessKeyId: 'ak',
      secretAccessKey: 'sk',
      region: 'us-east-1',
    });
    expect(mockApi.validateBedrockCredentials).toHaveBeenCalledWith(
      JSON.stringify({ accessKeyId: 'ak', secretAccessKey: 'sk', region: 'us-east-1' }),
    );
    expect(result).toEqual({ valid: true });
  });

  it('saveBedrockCredentials serializes and calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().saveBedrockCredentials({
      accessKeyId: 'ak',
      secretAccessKey: 'sk',
      region: 'us-east-1',
    });
    expect(result).toEqual({ id: 'cfg1' });
  });

  it('getBedrockCredentials calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = await getMyBoTeam().getBedrockCredentials();
    expect(result).toEqual({ accessKey: 'ak' });
  });

  it('fetchBedrockModels calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/lib/myboteam');
    const result = getMyBoTeam().fetchBedrockModels('creds');
    expect(mockApi.fetchBedrockModels).toHaveBeenCalledWith('creds');
    expect(result).toEqual(['model1']);
  });
});
