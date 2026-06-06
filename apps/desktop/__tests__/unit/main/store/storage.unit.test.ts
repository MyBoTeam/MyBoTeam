import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPath = vi.hoisted(() =>
  vi.fn((name: string) => {
    if (name === 'userData') return '/mock/userData';
    return '/mock/default';
  }),
);

vi.mock('node:path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
  },
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
}));

vi.mock('electron', () => ({
  app: {
    getPath: mockGetPath,
    isPackaged: false,
  },
}));

import { getDatabasePath } from '@main/store/storage';

describe('storage (path derivation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDatabasePath', () => {
    it('should return dev db path when not packaged', () => {
      const result = getDatabasePath();
      expect(result).toBe('/mock/userData/myboteam-dev.db');
      expect(mockGetPath).toHaveBeenCalledWith('userData');
    });

    it('should return production db path when packaged', async () => {
      const mod = await import('electron');
      (mod.app.isPackaged as boolean) = true;
      const result = getDatabasePath();
      expect(result).toBe('/mock/userData/myboteam.db');
      (mod.app.isPackaged as boolean) = false;
    });
  });
});
