import * as fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPlatformShell,
  getShellArgs,
  quoteForShell,
  stripAnsi,
} from '../../../src/utils/shell.js';

describe('stripAnsi', () => {
  it('removes ANSI color codes', () => {
    expect(stripAnsi('\x1B[31mred\x1B[0m')).toBe('red');
  });

  it('removes ANSI bold codes', () => {
    expect(stripAnsi('\x1B[1mbold\x1B[22m')).toBe('bold');
  });

  it('removes ANSI cursor codes', () => {
    expect(stripAnsi('\x1B[2Kclear')).toBe('clear');
  });

  it('returns plain text unchanged', () => {
    expect(stripAnsi('hello world')).toBe('hello world');
  });

  it('returns empty string unchanged', () => {
    expect(stripAnsi('')).toBe('');
  });
});

describe('quoteForShell (Unix)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns plain word unquoted', () => {
    expect(quoteForShell('hello')).toBe('hello');
  });

  it('quotes argument with spaces', () => {
    expect(quoteForShell('hello world')).toBe("'hello world'");
  });

  it('quotes argument with double quotes', () => {
    expect(quoteForShell('say "hi"')).toBe('\'say "hi"\'');
  });

  it('quotes argument with single quotes', () => {
    expect(quoteForShell("it's")).toBe("'it'\\''s'");
  });

  it('handles alphanumeric args without quoting', () => {
    expect(quoteForShell('foo123')).toBe('foo123');
    expect(quoteForShell('--flag=value')).toBe('--flag=value');
  });
});

describe('getShellArgs (Unix)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns -c and command', () => {
    expect(getShellArgs('echo hello')).toEqual(['-c', 'echo hello']);
  });

  it('handles empty command', () => {
    expect(getShellArgs('')).toEqual(['-c', '']);
  });
});

describe('getPlatformShell (Unix)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses SHELL env var when set', () => {
    vi.stubEnv('SHELL', '/bin/zsh');
    expect(getPlatformShell()).toBe('/bin/zsh');
  });

  it('uses /bin/sh for packaged macOS', () => {
    const origProcess = globalThis.process;
    vi.stubGlobal('process', { ...origProcess, platform: 'darwin' });
    vi.stubEnv('SHELL', '');
    try {
      expect(getPlatformShell(true)).toBe('/bin/sh');
    } finally {
      vi.stubGlobal('process', origProcess);
    }
  });

  it('falls back when SHELL is not set', () => {
    vi.stubEnv('SHELL', '');
    const shell = getPlatformShell();
    const exists =
      fs.existsSync('/bin/bash') || fs.existsSync('/bin/zsh') || fs.existsSync('/bin/sh');
    expect(exists).toBe(true);
    expect(shell).toBeTruthy();
  });
});
