import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenCodeAdapter } from '../../../../src/internal/classes/open-code-adapter.js';

vi.mock('@opencode-ai/sdk/v2', () => ({
  createOpencodeClient: vi.fn(),
}));

describe('OpenCodeAdapter session resume (sessionId reuse)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  interface SessionCreateMock {
    calls: number;
    lastTitle?: string;
  }
  interface SessionPromptMock {
    calls: number;
    lastSessionID?: string;
    lastText?: string;
  }

  function buildFakeClient(): {
    client: unknown;
    sessionCreate: SessionCreateMock;
    sessionPrompt: SessionPromptMock;
  } {
    const sessionCreate: SessionCreateMock = { calls: 0 };
    const sessionPrompt: SessionPromptMock = { calls: 0 };

    const client = {
      session: {
        create: async (args: { title: string }) => {
          sessionCreate.calls += 1;
          sessionCreate.lastTitle = args.title;
          return { id: 'freshly_created_session_id' };
        },
        prompt: (args: { sessionID: string; parts: Array<{ text: string }> }) => {
          sessionPrompt.calls += 1;
          sessionPrompt.lastSessionID = args.sessionID;
          sessionPrompt.lastText = args.parts[0]?.text;
          return Promise.resolve();
        },
      },
      event: {
        subscribe: async () => {
          const stream: AsyncIterable<unknown> = {
            [Symbol.asyncIterator]() {
              return {
                next: () => new Promise(() => {}),
              };
            },
          };
          return {
            stream,
            close: () => {},
          };
        },
      },
    };

    return { client, sessionCreate, sessionPrompt };
  }

  async function runStartTask(
    adapter: OpenCodeAdapter,
    config: { prompt: string; sessionId?: string; modelId?: string },
    fake: ReturnType<typeof buildFakeClient>,
  ): Promise<void> {
    adapter.options.getServerUrl = async () => 'http://127.0.0.1:4096';
    vi.mocked(createOpencodeClient).mockReturnValue(fake.client as never);

    const startPromise = adapter.startTask({ ...config, taskId: 'tsk_test' });
    await Promise.race([
      startPromise.catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 200)),
    ]);
  }

  it('calls session.create when config.sessionId is not provided', async () => {
    const adapter = new OpenCodeAdapter(
      { platform: 'darwin', isPackaged: false, tempPath: '/tmp' },
      'tsk_fresh',
    );
    const fake = buildFakeClient();
    await runStartTask(adapter, { prompt: 'What is 7+4?' }, fake);

    expect(fake.sessionCreate.calls).toBe(1);
    expect(fake.sessionPrompt.calls).toBe(1);
    expect(fake.sessionPrompt.lastSessionID).toBe('freshly_created_session_id');
    expect(fake.sessionPrompt.lastText).toBe('What is 7+4?');
  });

  it('reuses config.sessionId and does NOT call session.create on resume', async () => {
    const adapter = new OpenCodeAdapter(
      { platform: 'darwin', isPackaged: false, tempPath: '/tmp' },
      'tsk_resume',
    );
    const fake = buildFakeClient();
    await runStartTask(
      adapter,
      { prompt: 'add 5 to the result', sessionId: 'session_from_turn_1' },
      fake,
    );

    expect(fake.sessionCreate.calls).toBe(0);
    expect(fake.sessionPrompt.calls).toBe(1);
    expect(fake.sessionPrompt.lastSessionID).toBe('session_from_turn_1');
    expect(fake.sessionPrompt.lastText).toBe('add 5 to the result');
  });
});
