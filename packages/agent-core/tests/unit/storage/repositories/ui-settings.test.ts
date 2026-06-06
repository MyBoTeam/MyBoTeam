import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
}));

import { flushDatabase } from '../../../../src/storage/database.js';
import {
  getCloseBehavior,
  getDebugMode,
  getLanguage,
  getNotificationsEnabled,
  getOnboardingComplete,
  getTheme,
  setCloseBehavior,
  setDebugMode,
  setLanguage,
  setNotificationsEnabled,
  setOnboardingComplete,
  setTheme,
  VALID_LANGUAGES,
  VALID_THEMES,
} from '../../../../src/storage/repositories/ui-settings.js';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    debug_mode: 0,
    onboarding_complete: 0,
    theme: 'system',
    notifications_enabled: 1,
    close_behavior: 'keep-daemon',
    language: 'auto',
    ...overrides,
  };
}

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) {
    return [];
  }
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('ui-settings repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDebugMode', () => {
    it('returns true when debug_mode is 1', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ debug_mode: 1 })));
      expect(getDebugMode()).toBe(true);
    });

    it('returns false when debug_mode is 0', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ debug_mode: 0 })));
      expect(getDebugMode()).toBe(false);
    });
  });

  describe('setDebugMode', () => {
    it('sets debug mode to enabled', () => {
      setDebugMode(true);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [1]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });

    it('sets debug mode to disabled', () => {
      setDebugMode(false);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [0]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });
  });

  describe('getOnboardingComplete', () => {
    it('returns true when onboarding_complete is 1', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ onboarding_complete: 1 })));
      expect(getOnboardingComplete()).toBe(true);
    });

    it('returns false when onboarding_complete is 0', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ onboarding_complete: 0 })));
      expect(getOnboardingComplete()).toBe(false);
    });
  });

  describe('setOnboardingComplete', () => {
    it('sets onboarding complete to true', () => {
      setOnboardingComplete(true);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [1]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });

    it('sets onboarding complete to false', () => {
      setOnboardingComplete(false);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [0]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });
  });

  describe('getTheme', () => {
    it('returns the stored valid theme', () => {
      for (const theme of VALID_THEMES) {
        mockDb.exec.mockReturnValueOnce(qResult(makeRow({ theme })));
        expect(getTheme()).toBe(theme);
      }
    });

    it('returns system for invalid theme value', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ theme: 'invalid-theme' })));
      expect(getTheme()).toBe('system');
    });
  });

  describe('setTheme', () => {
    it('sets a valid theme', () => {
      setTheme('dark');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        'dark',
      ]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });

    it('throws for invalid theme', () => {
      expect(() => setTheme('invalid' as never)).toThrow('Invalid theme value: invalid');
    });
  });

  describe('getNotificationsEnabled', () => {
    it('returns true when notifications_enabled is 1', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ notifications_enabled: 1 })));
      expect(getNotificationsEnabled()).toBe(true);
    });

    it('returns false when notifications_enabled is 0', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ notifications_enabled: 0 })));
      expect(getNotificationsEnabled()).toBe(false);
    });
  });

  describe('setNotificationsEnabled', () => {
    it('sets notifications enabled', () => {
      setNotificationsEnabled(true);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [1]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });
  });

  describe('getCloseBehavior', () => {
    it('returns stop-daemon when stored', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ close_behavior: 'stop-daemon' })));
      expect(getCloseBehavior()).toBe('stop-daemon');
    });

    it('returns keep-daemon as default', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ close_behavior: 'keep-daemon' })));
      expect(getCloseBehavior()).toBe('keep-daemon');
    });

    it('returns keep-daemon for unknown value', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ close_behavior: 'unknown' })));
      expect(getCloseBehavior()).toBe('keep-daemon');
    });
  });

  describe('setCloseBehavior', () => {
    it('sets valid close behavior', () => {
      setCloseBehavior('stop-daemon');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        'stop-daemon',
      ]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });

    it('throws for invalid close behavior', () => {
      expect(() => setCloseBehavior('invalid' as never)).toThrow('Invalid close behavior: invalid');
    });
  });

  describe('getLanguage', () => {
    it('returns the stored valid language', () => {
      for (const lang of VALID_LANGUAGES) {
        mockDb.exec.mockReturnValueOnce(qResult(makeRow({ language: lang })));
        expect(getLanguage()).toBe(lang);
      }
    });

    it('returns auto for invalid language value', () => {
      mockDb.exec.mockReturnValueOnce(qResult(makeRow({ language: 'invalid' })));
      expect(getLanguage()).toBe('auto');
    });
  });

  describe('setLanguage', () => {
    it('sets a valid language', () => {
      setLanguage('en');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_settings'), [
        'en',
      ]);
      expect(flushDatabase).toHaveBeenCalledOnce();
    });

    it('throws for invalid language', () => {
      expect(() => setLanguage('invalid' as never)).toThrow('Invalid language value: invalid');
    });
  });
});
