import { afterEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
const mockWriteFileSync = vi.hoisted(() => vi.fn());
const mockMkdirSync = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
}));

import {
  clearCopilotOAuth,
  getCopilotOAuthStatus,
  setCopilotOAuthTokens,
} from '../../../src/providers/copilot.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getCopilotOAuthStatus', () => {
  it('returns disconnected when auth file does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(false);
  });

  it('returns disconnected when copilot entry is missing', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({}));
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(false);
  });

  it('returns disconnected when entry is not an object', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ 'github-copilot': 'string-instead-of-object' }),
    );
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(false);
  });

  it('returns disconnected when type is not copilot-oauth', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ 'github-copilot': { type: 'api_key', access: 'sk-test' } }),
    );
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(false);
  });

  it('returns connected when access token exists', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        'github-copilot': {
          type: 'copilot-oauth',
          access: 'ghu_test_access_token',
          username: 'testuser',
          expires: 1234567890,
        },
      }),
    );
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(true);
    expect(status.username).toBe('testuser');
    expect(status.expiresAt).toBe(1234567890);
  });

  it('returns connected when only refresh token exists', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        'github-copilot': {
          type: 'copilot-oauth',
          refresh: 'ghr_test_refresh_token',
        },
      }),
    );
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(true);
  });

  it('returns disconnected when access token is empty string', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        'github-copilot': {
          type: 'copilot-oauth',
          access: '   ',
        },
      }),
    );
    const status = getCopilotOAuthStatus();
    expect(status.connected).toBe(false);
  });
});

describe('setCopilotOAuthTokens', () => {
  it('writes tokens to auth.json', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({}));

    setCopilotOAuthTokens({
      accessToken: 'ghu_test_access',
      refreshToken: 'ghr_test_refresh',
      expiresAt: 1234567890,
      username: 'testuser',
    });

    expect(mockMkdirSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.stringContaining('ghu_test_access'),
      'utf8',
    );
  });

  it('merges with existing auth.json content', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        'other-provider': { type: 'api_key', key: 'sk-test' },
      }),
    );

    setCopilotOAuthTokens({ accessToken: 'ghu_test' });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.stringContaining('other-provider'),
      'utf8',
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.stringContaining('github-copilot'),
      'utf8',
    );
  });
});

describe('clearCopilotOAuth', () => {
  it('removes copilot entry from auth.json', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        'github-copilot': { type: 'copilot-oauth', access: 'ghu_test' },
        'other-provider': { type: 'api_key', key: 'sk-test' },
      }),
    );

    clearCopilotOAuth();

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.not.stringContaining('github-copilot'),
      'utf8',
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.stringContaining('other-provider'),
      'utf8',
    );
  });
});
