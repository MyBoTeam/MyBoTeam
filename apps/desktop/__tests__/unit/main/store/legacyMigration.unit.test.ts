import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockCopyFileSync = vi.hoisted(() => vi.fn());
const mockMkdirSync = vi.hoisted(() => vi.fn());
const mockGetPath = vi.hoisted(() => vi.fn());
const mockIsPackaged = vi.hoisted(() => ({ current: false }));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    copyFileSync: mockCopyFileSync,
    mkdirSync: mockMkdirSync,
  },
  existsSync: mockExistsSync,
  copyFileSync: mockCopyFileSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock('node:path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
  },
  join: (...args: string[]) => args.join('/'),
}));

vi.mock('electron', () => ({
  app: {
    getPath: mockGetPath,
    get isPackaged() {
      return mockIsPackaged.current;
    },
  },
}));

import { migrateLegacyData } from '@main/store/legacyMigration';

describe('legacyMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReset();
    mockCopyFileSync.mockReset();
    mockMkdirSync.mockReset();
    mockGetPath.mockReset();
    mockGetPath.mockReturnValue('/mock/userData');
    mockExistsSync.mockReturnValue(false);
    mockIsPackaged.current = false;
  });

  it('should skip migration when current DB already exists', () => {
    mockExistsSync.mockImplementation((p: string) => p === '/mock/userData/myboteam-dev.db');

    const result = migrateLegacyData();

    expect(result).toBe(false);
    expect(mockCopyFileSync).not.toHaveBeenCalled();
  });

  it('should migrate legacy DB name in current userData path', () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/openwork-dev.db') return true;
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db-wal') return true;
      if (p === '/mock/userData/openwork-dev.db-shm') return false;
      if (p === '/mock/userData/secure-storage-dev.json') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(true);
    expect(mockCopyFileSync).toHaveBeenCalledTimes(2);
  });

  it('should return true when legacy db name exists and files are copied', () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return true;
      if (p === '/mock/userData/openwork-dev.db-wal') return false;
      if (p === '/mock/userData/openwork-dev.db-shm') return false;
      if (p === '/mock/userData/secure-storage-dev.json') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(true);
    expect(mockCopyFileSync).toHaveBeenCalledTimes(1);
  });

  it('should migrate from legacy paths', () => {
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      if (name === 'appData') return '/mock/appData';
      return '/mock/default';
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return false;
      if (p === '/mock/appData/MyBoTeam') return true;
      if (p === '/mock/appData/MyBoTeam/myboteam-dev.db') return true;
      if (p === '/mock/appData/MyBoTeam/myboteam-dev.db-wal') return true;
      if (p === '/mock/appData/MyBoTeam/secure-storage-dev.json') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(true);
    expect(mockCopyFileSync).toHaveBeenCalled();
    expect(mockMkdirSync).toHaveBeenCalledWith('/mock/userData', { recursive: true });
  });

  it('should handle copy errors gracefully', () => {
    mockCopyFileSync.mockImplementation(() => {
      throw new Error('Disk full');
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return true;
      if (p === '/mock/userData/openwork-dev.db-wal') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(false);
  });

  it('should handle getLegacyPaths errors gracefully', () => {
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      throw new Error('Unknown path');
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return false;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(false);
  });

  it('should handle mkdirSync failure gracefully', () => {
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      if (name === 'appData') return '/mock/appData';
      return '/mock/default';
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return false;
      if (p === '/mock/appData/MyBoTeam') return true;
      if (p === '/mock/appData/MyBoTeam/myboteam-dev.db') return true;
      return false;
    });
    mockMkdirSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = migrateLegacyData();

    expect(result).toBe(false);
  });

  it('should return false when no legacy data exists', () => {
    mockExistsSync.mockReturnValue(false);

    const result = migrateLegacyData();

    expect(result).toBe(false);
  });

  it('should handle packaged mode correctly - legacy db in userData', () => {
    mockIsPackaged.current = true;
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      if (name === 'appData') return '/mock/appData';
      return '/mock/default';
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return true;
      if (p === '/mock/userData/openwork.db-wal') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(true);
    expect(mockCopyFileSync).toHaveBeenCalled();
  });

  it('should handle no legacy data in packaged mode gracefully', () => {
    mockIsPackaged.current = true;
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      if (name === 'appData') return '/mock/appData';
      return '/mock/default';
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return false;
      if (p === '/mock/appData/Openwork') return false;
      if (p === '/mock/appData/myboteam') return false;
      if (p === '/mock/appData/MyBoTeam') return false;
      if (p === '/mock/appData/openwork') return false;
      if (p === '/mock/appData/@myboteam') return false;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(false);
  });

  it('should use correct db names based on app.isPackaged at call time', () => {
    // Note: NEW_DB_NAME and SECURE_STORAGE_NAME are captured at module import

    mockIsPackaged.current = true;
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') return '/mock/userData';
      if (name === 'appData') return '/mock/appData';
      return '/mock/default';
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/mock/userData/myboteam-dev.db') return false;
      if (p === '/mock/userData/openwork.db') return false;
      if (p === '/mock/userData/openwork-dev.db') return false;
      if (p === '/mock/appData/Openwork') return true;
      if (p === '/mock/appData/Openwork/openwork.db') return true;
      if (p === '/mock/appData/Openwork/openwork.db-wal') return true;
      if (p === '/mock/appData/Openwork/secure-storage-dev.json') return true;
      return false;
    });

    const result = migrateLegacyData();

    expect(result).toBe(true);

    expect(mockCopyFileSync).toHaveBeenCalledTimes(3);
  });
});
