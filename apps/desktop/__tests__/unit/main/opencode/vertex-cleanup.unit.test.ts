import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData'),
  },
}));

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockUnlinkSync = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  unlinkSync: mockUnlinkSync,
}));

vi.mock('node:path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
  },
  join: (...args: string[]) => args.join('/'),
}));

import {
  cleanupVertexServiceAccountKey,
  VERTEX_SA_KEY_FILENAME,
} from '@main/opencode/vertex-cleanup';

describe('vertex-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete the key file when it exists', () => {
    mockExistsSync.mockReturnValue(true);
    cleanupVertexServiceAccountKey();
    expect(mockExistsSync).toHaveBeenCalledWith('/mock/userData/vertex-sa-key.json');
    expect(mockUnlinkSync).toHaveBeenCalledWith('/mock/userData/vertex-sa-key.json');
  });

  it('should not delete when the key file does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    cleanupVertexServiceAccountKey();
    expect(mockExistsSync).toHaveBeenCalledWith('/mock/userData/vertex-sa-key.json');
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    mockExistsSync.mockImplementation(() => {
      throw new Error('permission denied');
    });
    expect(() => cleanupVertexServiceAccountKey()).not.toThrow();
  });

  it('should export the correct filename constant', () => {
    expect(VERTEX_SA_KEY_FILENAME).toBe('vertex-sa-key.json');
  });
});
