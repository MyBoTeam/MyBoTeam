import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('getMyBoTeam - HuggingFace helpers', () => {
  const mockApi = {
    getVersion: vi.fn(),
    listHuggingFaceModels: vi.fn().mockResolvedValue(['model1']),
    downloadHuggingFaceModel: vi.fn().mockResolvedValue(undefined),
    startHuggingFaceServer: vi.fn().mockResolvedValue({ port: 8080 }),
    onHuggingFaceDownloadProgress: vi.fn().mockReturnValue(() => {}),
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

  it('listHuggingFaceModels calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const result = await getMyBoTeam().listHuggingFaceModels();
    expect(mockApi.listHuggingFaceModels).toHaveBeenCalled();
    expect(result).toEqual(['model1']);
  });

  it('downloadHuggingFaceModel calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    await getMyBoTeam().downloadHuggingFaceModel('model-id');
    expect(mockApi.downloadHuggingFaceModel).toHaveBeenCalledWith('model-id');
  });

  it('startHuggingFaceServer calls underlying API', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const result = await getMyBoTeam().startHuggingFaceServer('model-id');
    expect(mockApi.startHuggingFaceServer).toHaveBeenCalledWith('model-id');
    expect(result).toEqual({ port: 8080 });
  });

  it('onHuggingFaceDownloadProgress subscribes', async () => {
    const { getMyBoTeam } = await import('@/config/myboteam');
    const cb = () => {};
    const result = getMyBoTeam().onHuggingFaceDownloadProgress(cb);
    expect(mockApi.onHuggingFaceDownloadProgress).toHaveBeenCalledWith(cb);
    expect(result).toBeDefined();
  });
});
