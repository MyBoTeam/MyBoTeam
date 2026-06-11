import { describe, expect, it } from 'vitest';
import { darkTheme, lightTheme } from '../themes';
import { duration, easing } from '../tokens/animations';
import { colorTokens } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { radius, spacing } from '../tokens/spacing';
import { fontFamily, fontSize, fontWeight } from '../tokens/typography';

describe('Color tokens', () => {
  it('has required color tokens', () => {
    const requiredTokens = [
      'background',
      'foreground',
      'card',
      'popover',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'border',
      'input',
      'ring',
    ];
    for (const token of requiredTokens) {
      expect(colorTokens.find((t) => t.variable === `--${token}`)).toBeDefined();
    }
  });

  it('has light and dark values for all tokens', () => {
    for (const token of colorTokens) {
      expect(token.light).toBeTruthy();
      expect(token.dark).toBeTruthy();
    }
  });
});

describe('Typography tokens', () => {
  it('has font family definitions', () => {
    expect(fontFamily.sans).toBeTruthy();
    expect(fontFamily.mono).toBeTruthy();
  });

  it('has font weight definitions', () => {
    expect(fontWeight.normal).toBe('400');
    expect(fontWeight.bold).toBe('700');
  });

  it('has font size definitions', () => {
    expect(fontSize.xs).toBeTruthy();
    expect(fontSize.base).toBeTruthy();
    expect(fontSize.xl).toBeTruthy();
  });
});

describe('Spacing tokens', () => {
  it('has radius definitions', () => {
    expect(radius.md).toBeTruthy();
    expect(radius.lg).toBeTruthy();
    expect(radius.full).toBe('9999px');
  });

  it('has spacing scale', () => {
    expect(spacing[4]).toBe('1rem');
    expect(spacing[8]).toBe('2rem');
  });
});

describe('Shadow tokens', () => {
  it('has shadow definitions', () => {
    expect(shadows.sm).toBeTruthy();
    expect(shadows.md).toBeTruthy();
    expect(shadows.lg).toBeTruthy();
    expect(shadows.none).toBe('0 0 #0000');
  });
});

describe('Animation tokens', () => {
  it('has easing definitions', () => {
    expect(easing.linear).toBe('linear');
    expect(easing.inOut).toBeTruthy();
  });

  it('has duration definitions', () => {
    expect(duration[200]).toBe('200ms');
  });
});

describe('Themes', () => {
  it('light theme has all color keys', () => {
    const requiredKeys = [
      'background',
      'foreground',
      'card',
      'popover',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'border',
      'input',
      'ring',
    ];
    for (const key of requiredKeys) {
      expect(lightTheme.colors[key]).toBeDefined();
    }
  });

  it('dark theme has all color keys', () => {
    const requiredKeys = [
      'background',
      'foreground',
      'card',
      'popover',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'border',
      'input',
      'ring',
    ];
    for (const key of requiredKeys) {
      expect(darkTheme.colors[key]).toBeDefined();
    }
  });

  it('light and dark values differ for key tokens', () => {
    expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    expect(lightTheme.colors.foreground).not.toBe(darkTheme.colors.foreground);
  });
});
