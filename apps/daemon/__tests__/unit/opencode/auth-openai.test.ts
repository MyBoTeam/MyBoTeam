import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let connected = false;
let mockExpires: number | undefined;
let oauthPlanValue: 'free' | 'paid' = 'paid';

vi.mock('@myboteam/agent-core', () => ({
  detectOpenAiOauthPlan: vi.fn(async () => oauthPlanValue),
  getOpenAiOauthAccessToken: vi.fn(() => (connected ? 'sk-fake-token' : null)),
  getOpenAiOauthStatus: vi.fn(() =>
    connected ? { connected: true, expires: mockExpires } : { connected: false },
  ),
  getOpenCodeAuthJsonPath: vi.fn(() => '/tmp/fake-auth.json'),
}));

vi.mock('../../../src/logger.js', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const transientCloseMock = vi.fn();
const providerAuthMock = vi.fn(async () => ({
  data: {
    openai: [
      { type: 'oauth' as const, label: 'ChatGPT Pro/Plus' },
      { type: 'api' as const, label: 'API Key' },
    ],
  },
}));
const oauthAuthorizeMock = vi.fn(async () => ({
  data: { url: 'https://auth.openai.com/login?client_id=fake' },
}));

interface CallbackHandle {
  resolve: () => void;
  reject: (err: unknown) => void;
  signal?: AbortSignal;
}
let pendingCallback: CallbackHandle | null = null;
const oauthCallbackMock = vi.fn(async (_params: unknown, options?: { signal?: AbortSignal }) => {
  return new Promise<{ data: boolean }>((resolve, reject) => {
    pendingCallback = {
      resolve: () => resolve({ data: true }),
      reject,
      signal: options?.signal,
    };

    options?.signal?.addEventListener(
      'abort',
      () => {
        const err = new Error('AbortError');
        err.name = 'AbortError';
        reject(err);
      },
      { once: true },
    );
  });
});

vi.mock('../../../src/opencode/server-transient.js', () => ({
  createTransientOpencodeClient: vi.fn(async () => ({
    client: {
      provider: {
        auth: providerAuthMock,
        oauth: {
          authorize: oauthAuthorizeMock,
          callback: oauthCallbackMock,
        },
      },
    },
    close: transientCloseMock,
  })),
}));

const { OpenAiOauthManager } = await import('../../../src/opencode/auth-openai.js');

describe('OpenAiOauthManager', () => {
  beforeEach(() => {
    connected = false;
    mockExpires = undefined;
    oauthPlanValue = 'paid';
    pendingCallback = null;
    transientCloseMock.mockClear();
    providerAuthMock.mockClear();
    oauthAuthorizeMock.mockClear();
    oauthCallbackMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('startLogin returns a sessionId + authorizeUrl from the SDK', async () => {
    const manager = new OpenAiOauthManager({} as never);

    const { sessionId, authorizeUrl } = await manager.startLogin();

    expect(sessionId).toMatch(/^[0-9a-f-]{30,}$/i);
    expect(authorizeUrl).toBe('https://auth.openai.com/login?client_id=fake');
    expect(providerAuthMock).toHaveBeenCalledOnce();
    expect(oauthAuthorizeMock).toHaveBeenCalledWith(
      expect.objectContaining({ providerID: 'openai', method: 0 }),
    );

    expect(oauthCallbackMock).toHaveBeenCalledWith(
      expect.objectContaining({ providerID: 'openai', method: 0 }),
      expect.any(Object),
    );

    manager.dispose();
    expect(transientCloseMock).toHaveBeenCalled();
  });

  it('awaitCompletion resolves with { ok: true, plan } once oauth.callback resolves', async () => {
    const manager = new OpenAiOauthManager({} as never);
    oauthPlanValue = 'paid';

    const { sessionId } = await manager.startLogin();

    setTimeout(() => {
      pendingCallback?.resolve();
    }, 20);

    const result = await manager.awaitCompletion({ sessionId, timeoutMs: 5_000 });

    expect(result).toEqual({ ok: true, plan: 'paid' });
    expect(transientCloseMock).toHaveBeenCalled();
  });

  it('propagates the AbortSignal into the oauth.callback RPC', async () => {
    const manager = new OpenAiOauthManager({} as never);
    await manager.startLogin();

    expect(pendingCallback).not.toBeNull();
    expect(pendingCallback?.signal).toBeInstanceOf(AbortSignal);
    expect(pendingCallback?.signal?.aborted).toBe(false);

    manager.dispose();

    expect(pendingCallback?.signal?.aborted).toBe(true);
  });

  it('awaitCompletion returns { ok: false } when the caller timeoutMs fires before the flow completes', async () => {
    const manager = new OpenAiOauthManager({} as never);

    const { sessionId } = await manager.startLogin();

    const result = await manager.awaitCompletion({ sessionId, timeoutMs: 50 });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toMatch(/timed out/i);
    }

    manager.dispose();
  });

  it('awaitCompletion surfaces opencode-side callback errors verbatim', async () => {
    const manager = new OpenAiOauthManager({} as never);
    const { sessionId } = await manager.startLogin();

    setTimeout(() => {
      pendingCallback?.reject(new Error('oauth exchange failed: 400 bad_verification_code'));
    }, 10);

    const result = await manager.awaitCompletion({ sessionId, timeoutMs: 5_000 });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toMatch(/bad_verification_code/);
    }

    manager.dispose();
  });

  it('startLogin aborts the prior active session when called twice', async () => {
    const manager = new OpenAiOauthManager({} as never);

    const first = await manager.startLogin();
    const firstSignal = pendingCallback?.signal;

    const second = await manager.startLogin();

    expect(second.sessionId).not.toBe(first.sessionId);
    expect(firstSignal?.aborted).toBe(true);
    expect(transientCloseMock).toHaveBeenCalled();

    manager.dispose();
  });

  it('awaitCompletion rejects unknown sessionIds without crashing', async () => {
    const manager = new OpenAiOauthManager({} as never);

    const result = await manager.awaitCompletion({
      sessionId: 'nonexistent',
      timeoutMs: 100,
    });

    expect(result).toEqual({ ok: false, error: expect.stringMatching(/No matching/i) });
    manager.dispose();
  });

  it('status() and getAccessToken() read through the agent-core helpers', async () => {
    const manager = new OpenAiOauthManager({} as never);

    expect(manager.status()).toEqual({ connected: false });
    expect(manager.getAccessToken()).toBeNull();

    connected = true;
    const status = manager.status();
    expect(status.connected).toBe(true);
    expect(manager.getAccessToken()).toBe('sk-fake-token');

    manager.dispose();
  });

  it('startLogin falls back to any OAuth method when preferred label is absent', async () => {
    providerAuthMock.mockReturnValueOnce({
      data: {
        openai: [
          { type: 'api', label: 'API Key' },
          { type: 'oauth', label: 'Other OAuth' },
        ],
      },
    });
    const manager = new OpenAiOauthManager({} as never);

    const { authorizeUrl } = await manager.startLogin();

    expect(authorizeUrl).toBe('https://auth.openai.com/login?client_id=fake');

    expect(oauthAuthorizeMock).toHaveBeenCalledWith(
      expect.objectContaining({ providerID: 'openai', method: 1 }),
    );

    manager.dispose();
  });

  it('startLogin throws when provider has no OAuth methods at all', async () => {
    providerAuthMock.mockReturnValueOnce({
      data: {
        openai: [{ type: 'api', label: 'API Key' }],
      },
    });
    const manager = new OpenAiOauthManager({} as never);

    await expect(manager.startLogin()).rejects.toThrow(
      'OpenAI authentication is not available in this OpenCode runtime.',
    );
    manager.dispose();
  });

  it('startLogin throws when provider is absent from the auth response', async () => {
    providerAuthMock.mockReturnValueOnce({ data: {} });
    const manager = new OpenAiOauthManager({} as never);

    await expect(manager.startLogin()).rejects.toThrow(
      'OpenAI authentication is not available in this OpenCode runtime.',
    );
    manager.dispose();
  });

  it('startLogin throws when authorize URL is missing from the response', async () => {
    oauthAuthorizeMock.mockReturnValueOnce({ data: {} });
    const manager = new OpenAiOauthManager({} as never);

    await expect(manager.startLogin()).rejects.toThrow(
      'OpenAI authentication did not return an authorization URL.',
    );
    manager.dispose();
  });

  it('startLogin throws when manager is disposed', async () => {
    const manager = new OpenAiOauthManager({} as never);
    manager.dispose();

    await expect(manager.startLogin()).rejects.toThrow('OAuth manager is disposed.');
  });

  it('dispose is idempotent — calling twice does not throw', () => {
    const manager = new OpenAiOauthManager({} as never);
    expect(() => {
      manager.dispose();
      manager.dispose();
    }).not.toThrow();
  });

  it('abortActive is safe when no session is active', () => {
    const manager = new OpenAiOauthManager({} as never);

    manager.dispose();
    manager.dispose();
  });
});
