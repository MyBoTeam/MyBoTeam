import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
} from '@/config/i18n';

describe('i18n constants', () => {
  it('has supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'zh-CN', 'ru', 'fr']);
  });

  it('has namespaces', () => {
    expect(NAMESPACES).toContain('common');
    expect(NAMESPACES).toContain('home');
    expect(NAMESPACES).toContain('settings');
  });
});

describe('getLanguagePreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns "auto" when no preference stored', () => {
    expect(getLanguagePreference()).toBe('auto');
  });

  it('returns stored preference', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(getLanguagePreference()).toBe('fr');
  });

  it('returns "auto" for invalid stored value', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'invalid');
    expect(getLanguagePreference()).toBe('auto');
  });

  it('returns stored "auto" value', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'auto');
    expect(getLanguagePreference()).toBe('auto');
  });
});
