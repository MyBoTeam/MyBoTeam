import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('node:fs', () => mockFs);

import {
  detectOpenAiOauthPlan,
  getOpenAiOauthAccessToken,
  getOpenAiOauthStatus,
  getOpenCodeAuthPath,
  getOpenCodeDataHome,
  readOpenAiOauthPlan,
  writeOpenCodeAuth,
} from '../../../src/opencode/auth.js';

beforeEach(() => {
  Object.values(mockFs).forEach((fn) => {
    fn.mockClear?.();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getOpenCodeDataHome', () => {
  it('uses XDG_DATA_HOME when set', () => {
    const OLD_XDG = process.env.XDG_DATA_HOME;
    process.env.XDG_DATA_HOME = '/custom/xdg';
    expect(getOpenCodeDataHome()).toBe('/custom/xdg');
    process.env.XDG_DATA_HOME = OLD_XDG;
  });
});

describe('getOpenCodeAuthPath', () => {
  it('returns path ending with auth.json', () => {
    const p = getOpenCodeAuthPath();
    expect(p).toContain('auth.json');
  });
});

describe('getOpenAiOauthStatus', () => {
  it('returns disconnected when auth file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(getOpenAiOauthStatus()).toEqual({ connected: false });
  });

  it('returns disconnected when openai entry is missing', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(getOpenAiOauthStatus()).toEqual({ connected: false });
  });

  it('returns disconnected when openai entry is not oauth type', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'api_key', key: 'sk-test' } }),
    );
    expect(getOpenAiOauthStatus()).toEqual({ connected: false });
  });

  it('returns connected with expiry when valid oauth', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'oauth', refresh: 'rt_123', expires: 1700000000 } }),
    );
    expect(getOpenAiOauthStatus()).toEqual({ connected: true, expires: 1700000000 });
  });
});

describe('getOpenAiOauthAccessToken', () => {
  it('returns null when auth file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(getOpenAiOauthAccessToken()).toBeNull();
  });

  it('returns null when openai entry is missing', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(getOpenAiOauthAccessToken()).toBeNull();
  });

  it('returns null when openai entry is not oauth type', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'api_key', key: 'sk-test' } }),
    );
    expect(getOpenAiOauthAccessToken()).toBeNull();
  });

  it('returns null when oauth entry has no access token', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'oauth', refresh: 'rt_123' } }),
    );
    expect(getOpenAiOauthAccessToken()).toBeNull();
  });

  it('returns the access token when oauth entry is valid', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'oauth', access: 'at_abc123', refresh: 'rt_xyz' } }),
    );
    expect(getOpenAiOauthAccessToken()).toBe('at_abc123');
  });

  it('returns null when access token is an empty string', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ openai: { type: 'oauth', access: '   ', refresh: 'rt_xyz' } }),
    );
    expect(getOpenAiOauthAccessToken()).toBeNull();
  });
});

describe('readOpenAiOauthPlan', () => {
  it('returns paid for paid plan type', () => {
    const payload = JSON.stringify({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'Paid ' },
    });
    const encoded = Buffer.from(payload).toString('base64url');
    const token = `header.${encoded}.sig`;

    mockFs.readFileSync.mockReturnValue(JSON.stringify({ openai: { access: token } }));

    expect(readOpenAiOauthPlan('/fake/path')).toBe('paid');
  });

  it('returns free for free plan type', () => {
    const payload = JSON.stringify({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'Free' },
    });
    const encoded = Buffer.from(payload).toString('base64url');
    const token = `header.${encoded}.sig`;

    mockFs.readFileSync.mockReturnValue(JSON.stringify({ openai: { access: token } }));

    expect(readOpenAiOauthPlan('/fake/path')).toBe('free');
  });

  it('throws when no openai access token', () => {
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(() => readOpenAiOauthPlan('/fake/path')).toThrow(
      'does not include an OpenAI access token',
    );
  });

  it('throws when plan type is missing', () => {
    const payload = JSON.stringify({});
    const encoded = Buffer.from(payload).toString('base64url');
    const token = `header.${encoded}.sig`;

    mockFs.readFileSync.mockReturnValue(JSON.stringify({ openai: { access: token } }));

    expect(() => readOpenAiOauthPlan('/fake/path')).toThrow('does not include chatgpt_plan_type');
  });
});

describe('detectOpenAiOauthPlan', () => {
  it('returns the plan when immediately readable', async () => {
    const payload = JSON.stringify({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'free' },
    });
    const encoded = Buffer.from(payload).toString('base64url');
    const token = `header.${encoded}.sig`;

    mockFs.readFileSync.mockReturnValue(JSON.stringify({ openai: { access: token } }));

    const plan = await detectOpenAiOauthPlan({
      authStatePath: '/fake/path',
      timeoutMs: 100,
      pollMs: 10,
    });
    expect(plan).toBe('free');
  });

  it('throws on timeout when plan not readable', async () => {
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));

    await expect(
      detectOpenAiOauthPlan({ authStatePath: '/fake/path', timeoutMs: 50, pollMs: 10 }),
    ).rejects.toThrow('Timed out waiting');
  });
});

describe('writeOpenCodeAuth', () => {
  it('writes provider keys to auth.json when dir exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));

    writeOpenCodeAuth({
      anthropic: { type: 'api_key', key: 'sk-ant-test' },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('auth.json'),
      expect.stringContaining('sk-ant-test'),
    );
  });

  it('creates dir and writes new auth.json when dir does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);

    writeOpenCodeAuth({
      openai: { type: 'api_key', key: 'sk-openai-test' },
    });

    expect(mockFs.mkdirSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('merges with existing auth.json when it exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ 'existing-key': { type: 'api_key', key: 'sk-existing' } }),
    );

    writeOpenCodeAuth({
      'new-key': { type: 'api_key', key: 'sk-new' },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('existing-key'),
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('new-key'),
    );
  });

  it('handles corrupt existing auth.json by overwriting', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('not-json');

    writeOpenCodeAuth({
      provider: { type: 'api_key', key: 'sk-test' },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalled();
    const callContent = mockFs.writeFileSync.mock.calls[0]![1] as string;
    const parsed = JSON.parse(callContent);
    expect(parsed.provider.key).toBe('sk-test');
  });
});
