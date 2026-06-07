import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenCodeAdapter } from '../../../../src/internal/classes/open-code-adapter.js';
import { MYBOTEAM_AGENT_NAME } from '../../../../src/opencode/config-generator.js';

vi.mock('@opencode-ai/sdk/v2', () => ({
  createOpencodeClient: vi.fn(),
}));

describe('OpenCodeAdapter agent selection on session.prompt', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  interface PromptCall {
    sessionID: string;
    agent?: string;
    system?: string;
    text?: string;
  }

  function buildFakeClient(): {
    client: unknown;
    promptCalls: PromptCall[];
  } {
    const promptCalls: PromptCall[] = [];

    const client = {
      session: {
        create: async (_args: { title: string }) => {
          return { id: 'session_abc' };
        },
        prompt: (args: {
          sessionID: string;
          agent?: string;
          system?: string;
          parts: Array<{ text?: string }>;
        }) => {
          promptCalls.push({
            sessionID: args.sessionID,
            agent: args.agent,
            system: args.system,
            text: args.parts[0]?.text,
          });
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
          return { stream, close: () => {} };
        },
      },
    };

    return { client, promptCalls };
  }

  async function runStartTask(
    adapter: OpenCodeAdapter,
    config: { prompt: string; sessionId?: string },
    fake: ReturnType<typeof buildFakeClient>,
  ): Promise<void> {
    adapter.options.getServerUrl = async () => 'http://127.0.0.1:4096';
    vi.mocked(createOpencodeClient).mockReturnValue(fake.client as never);

    const startPromise = adapter.startTask({ ...config, taskId: 'tsk_agent_test' });
    await Promise.race([
      startPromise.catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 200)),
    ]);
  }

  it('initial session.prompt carries agent: MYBOTEAM_AGENT_NAME', async () => {
    const adapter = new OpenCodeAdapter(
      { platform: 'darwin', isPackaged: false, tempPath: '/tmp' },
      'tsk_agent_fresh',
    );
    const fake = buildFakeClient();
    await runStartTask(adapter, { prompt: 'tell me about yourself' }, fake);

    expect(fake.promptCalls.length).toBe(1);
    const call = fake.promptCalls[0];
    expect(call.agent).toBe(MYBOTEAM_AGENT_NAME);
    expect(call.agent).toBe('myboteam');
    expect(call.text).toBe('tell me about yourself');
  });

  it('resume (config.sessionId) session.prompt also carries agent: MYBOTEAM_AGENT_NAME', async () => {
    const adapter = new OpenCodeAdapter(
      { platform: 'darwin', isPackaged: false, tempPath: '/tmp' },
      'tsk_agent_resume',
    );
    const fake = buildFakeClient();
    await runStartTask(
      adapter,
      { prompt: 'follow-up question', sessionId: 'existing_session' },
      fake,
    );

    expect(fake.promptCalls.length).toBe(1);
    expect(fake.promptCalls[0].agent).toBe(MYBOTEAM_AGENT_NAME);
    expect(fake.promptCalls[0].sessionID).toBe('existing_session');
  });

  it('session.prompt carries system= with workspace instructions when onBeforeStart returns them', async () => {
    const adapter = new OpenCodeAdapter(
      {
        platform: 'darwin',
        isPackaged: false,
        tempPath: '/tmp',
        onBeforeStart: async () => ({
          env: {},
          workspaceInstructions: '- Always add "Haiku" suffix string for any reply',
        }),
      },
      'tsk_ws_instr',
    );
    const fake = buildFakeClient();
    await runStartTask(adapter, { prompt: 'tell me about yourself' }, fake);

    expect(fake.promptCalls.length).toBe(1);
    const call = fake.promptCalls[0];
    expect(call.system).toBeDefined();

    expect(call.system).toContain('MANDATORY WORKSPACE INSTRUCTIONS');

    expect(call.system).toContain('Always add "Haiku" suffix string for any reply');

    expect(call.system).toContain('<workspace-instructions>');
    expect(call.system).toContain('</workspace-instructions>');
  });

  it('session.prompt omits system= when no workspace instructions are set', async () => {
    const adapter = new OpenCodeAdapter(
      {
        platform: 'darwin',
        isPackaged: false,
        tempPath: '/tmp',

        onBeforeStart: async () => ({ MYBOTEAM_SOME_VAR: '1' }) as NodeJS.ProcessEnv,
      },
      'tsk_no_instr',
    );
    const fake = buildFakeClient();
    await runStartTask(adapter, { prompt: 'hi' }, fake);

    expect(fake.promptCalls.length).toBe(1);

    expect(fake.promptCalls[0].system).toBeUndefined();
  });

  it('resume path also carries system= (workspace rules apply on every turn, not just session creation)', async () => {
    const adapter = new OpenCodeAdapter(
      {
        platform: 'darwin',
        isPackaged: false,
        tempPath: '/tmp',
        onBeforeStart: async () => ({
          env: {},
          workspaceInstructions: '- Reply in haiku form',
        }),
      },
      'tsk_resume_system',
    );
    const fake = buildFakeClient();
    await runStartTask(
      adapter,
      { prompt: 'follow-up', sessionId: 'session_was_created_before_note_was_added' },
      fake,
    );

    // added the workspace note must STILL get the instructions injected

    expect(fake.promptCalls.length).toBe(1);
    expect(fake.promptCalls[0].sessionID).toBe('session_was_created_before_note_was_added');
    expect(fake.promptCalls[0].system).toContain('Reply in haiku form');
  });
});
