import { afterEach, describe, expect, it, vi } from 'vitest';
import { getModifierKeyLabel } from '@/config/platform';

describe('getModifierKeyLabel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns Option on macOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
    expect(getModifierKeyLabel()).toBe('Option');
  });

  it('returns Alt on non-macOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Windows' });
    expect(getModifierKeyLabel()).toBe('Alt');
  });

  it('returns Alt when navigator is undefined (SSR)', () => {
    vi.stubGlobal('navigator', undefined);
    expect(getModifierKeyLabel()).toBe('Alt');
  });
});
