import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyColorTheme, COLOR_CLASSES, isValidColor, VALID_COLORS } from '@/lib/theme-color';

describe('theme-color', () => {
  beforeEach(() => {
    document.documentElement.classList.remove(...COLOR_CLASSES);
  });

  describe('isValidColor()', () => {
    it('returns true for valid colors', () => {
      for (const color of VALID_COLORS) {
        expect(isValidColor(color)).toBe(true);
      }
    });

    it('returns false for invalid colors', () => {
      expect(isValidColor('invalid')).toBe(false);
      expect(isValidColor('red')).toBe(false);
      expect(isValidColor('')).toBe(false);
    });
  });

  describe('applyColorTheme()', () => {
    it('adds the correct theme class', () => {
      applyColorTheme('mint');
      expect(document.documentElement.classList.contains('theme-mint')).toBe(true);
    });

    it('removes previous theme classes', () => {
      applyColorTheme('mint');
      applyColorTheme('blue');
      expect(document.documentElement.classList.contains('theme-mint')).toBe(false);
      expect(document.documentElement.classList.contains('theme-blue')).toBe(true);
    });

    it('gracefully handles empty string', () => {
      applyColorTheme('');
      for (const cls of COLOR_CLASSES) {
        expect(document.documentElement.classList.contains(cls)).toBe(false);
      }
    });

    it('gracefully handles invalid color', () => {
      applyColorTheme('invalid');
      for (const cls of COLOR_CLASSES) {
        expect(document.documentElement.classList.contains(cls)).toBe(false);
      }
    });
  });
});
