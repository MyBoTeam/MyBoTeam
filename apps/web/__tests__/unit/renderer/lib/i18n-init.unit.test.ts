import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const i18nMock = {
    changeLanguage: vi.fn(),
    use: vi.fn(() => i18nMock),
    init: vi.fn().mockResolvedValue(undefined),
  };
  return i18nMock;
});

vi.mock('i18next', () => ({
  default: mocks,
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

import { changeLanguage, initI18n } from '@/i18n';

describe('initI18n', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes i18n', async () => {
    document.documentElement.lang = '';
    const result = initI18n();
    await result;
    expect(mocks.use).toHaveBeenCalled();
  });

  it('returns cached initialization on second call', async () => {
    const first = await initI18n();
    const second = await initI18n();
    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
  });
});

describe('changeLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.changeLanguage.mockResolvedValue(undefined);
  });

  it('changes language and stores preference', async () => {
    localStorage.setItem('openwork-language', 'auto');

    await changeLanguage('fr');

    expect(localStorage.getItem('openwork-language')).toBe('fr');
    expect(mocks.changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('resolves auto to detected language', async () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' });

    await changeLanguage('auto');

    expect(mocks.changeLanguage).toHaveBeenCalledWith('zh-CN');
    expect(localStorage.getItem('openwork-language')).toBe('auto');
  });

  it('resolves auto to English for unknown language', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });

    await changeLanguage('auto');

    expect(mocks.changeLanguage).toHaveBeenCalledWith('en');
  });
});
