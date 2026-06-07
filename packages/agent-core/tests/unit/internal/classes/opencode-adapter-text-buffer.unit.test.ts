import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenCodeAdapter } from '../../../../src/internal/classes/open-code-adapter.js';

describe('OpenCodeAdapter text-part buffer (out-of-order handling)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function constructAdapter(): OpenCodeAdapter {
    return new OpenCodeAdapter(
      {
        platform: 'darwin',
        isPackaged: false,
        tempPath: '/tmp',
      },
      'tsk_textbuf_test',
    );
  }

  it('replays buffered text parts as message events when role resolves to assistant', () => {
    const adapter = constructAdapter();
    const emittedMessages: unknown[] = [];
    adapter.on('message', (msg) => {
      emittedMessages.push(msg);
    });

    (adapter as unknown as { handlePartUpdated: (part: unknown) => void }).handlePartUpdated({
      id: 'part_1',
      messageID: 'msg_assistant_1',
      sessionID: 'sess_1',
      type: 'text',
      text: '7 + 4 = 11',
    });

    expect(emittedMessages).toHaveLength(0);

    (adapter as unknown as { handleMessageUpdated: (info: unknown) => void }).handleMessageUpdated({
      id: 'msg_assistant_1',
      role: 'assistant',
    });

    expect(emittedMessages).toHaveLength(1);
    const emitted = emittedMessages[0] as { type: string; part: { text: string } };
    expect(emitted.type).toBe('text');
    expect(emitted.part.text).toBe('7 + 4 = 11');
  });

  it('discards buffered text parts when role resolves to user (no phantom echo)', () => {
    const adapter = constructAdapter();
    const emittedMessages: unknown[] = [];
    adapter.on('message', (msg) => {
      emittedMessages.push(msg);
    });

    (adapter as unknown as { handlePartUpdated: (part: unknown) => void }).handlePartUpdated({
      id: 'part_1',
      messageID: 'msg_user_1',
      sessionID: 'sess_1',
      type: 'text',
      text: 'how much is 7+4',
    });

    expect(emittedMessages).toHaveLength(0);

    (adapter as unknown as { handleMessageUpdated: (info: unknown) => void }).handleMessageUpdated({
      id: 'msg_user_1',
      role: 'user',
    });

    expect(emittedMessages).toHaveLength(0);
  });

  it('still drops known-non-assistant text parts without buffering', () => {
    const adapter = constructAdapter();
    const emittedMessages: unknown[] = [];
    adapter.on('message', (msg) => {
      emittedMessages.push(msg);
    });

    (adapter as unknown as { handleMessageUpdated: (info: unknown) => void }).handleMessageUpdated({
      id: 'msg_user_1',
      role: 'user',
    });

    (adapter as unknown as { handlePartUpdated: (part: unknown) => void }).handlePartUpdated({
      id: 'part_1',
      messageID: 'msg_user_1',
      sessionID: 'sess_1',
      type: 'text',
      text: 'how much is 7+4',
    });

    expect(emittedMessages).toHaveLength(0);
  });

  it('emits in-order when message.updated precedes message.part.updated (normal flow)', () => {
    const adapter = constructAdapter();
    const emittedMessages: unknown[] = [];
    adapter.on('message', (msg) => {
      emittedMessages.push(msg);
    });

    (adapter as unknown as { handleMessageUpdated: (info: unknown) => void }).handleMessageUpdated({
      id: 'msg_assistant_1',
      role: 'assistant',
    });

    (adapter as unknown as { handlePartUpdated: (part: unknown) => void }).handlePartUpdated({
      id: 'part_1',
      messageID: 'msg_assistant_1',
      sessionID: 'sess_1',
      type: 'text',
      text: '7 + 4 = 11',
    });

    expect(emittedMessages).toHaveLength(1);
    const emitted = emittedMessages[0] as { type: string; part: { text: string } };
    expect(emitted.type).toBe('text');
    expect(emitted.part.text).toBe('7 + 4 = 11');
  });
});
