/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('i18next-browser-languagedetector', () => ({
  default: class LanguageDetector {},
}));

vi.mock('react-i18next', () => ({
  initReactI18next: {},
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
}));

describe('resolveAutoLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns zh-CN for zh-TW navigator', async () => {
    vi.stubGlobal('navigator', { language: 'zh-TW' });
    const { changeLanguage } = await import('@/i18n');
    const i18nModule = await import('i18next');
    await changeLanguage('auto');
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('zh-CN');
  });

  it('returns ru for ru-RU navigator', async () => {
    vi.stubGlobal('navigator', { language: 'ru-RU' });
    const { changeLanguage } = await import('@/i18n');
    const i18nModule = await import('i18next');
    await changeLanguage('auto');
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('ru');
  });

  it('returns fr for fr-FR navigator', async () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    const { changeLanguage } = await import('@/i18n');
    const i18nModule = await import('i18next');
    await changeLanguage('auto');
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('returns en for unknown navigator language', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    const { changeLanguage } = await import('@/i18n');
    const i18nModule = await import('i18next');
    await changeLanguage('auto');
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('returns en when navigator is undefined', async () => {
    vi.stubGlobal('navigator', undefined);
    const { changeLanguage } = await import('@/i18n');
    const i18nModule = await import('i18next');
    await changeLanguage('auto');
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('en');
  });
});
