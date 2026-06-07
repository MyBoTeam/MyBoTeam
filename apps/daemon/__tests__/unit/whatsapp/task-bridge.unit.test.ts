import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/logger.js', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@myboteam/agent-core')>();
  return { ...actual };
});

import type { InboundMessage, MessageTransport } from '../../../src/whatsapp/taskBridge.js';
import { MAX_MESSAGE_LENGTH, TaskBridge } from '../../../src/whatsapp/taskBridge.js';

class FakeTransport extends EventEmitter {
  sentMessages: Array<{ recipientId: string; text: string }> = [];
  async sendMessage(recipientId: string, text: string): Promise<void> {
    this.sentMessages.push({ recipientId, text });
  }
}

function makeMsg(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    messageId: 'msg-1',
    senderId: '1234@s.whatsapp.net',
    text: 'hello',
    timestamp: Date.now(),
    isGroup: false,
    isFromMe: true,
    senderName: undefined,
    ...overrides,
  };
}

describe('TaskBridge', () => {
  let transport: FakeTransport;
  let onTaskRequest: ReturnType<typeof vi.fn>;
  let bridge: TaskBridge;

  beforeEach(() => {
    transport = new FakeTransport();
    onTaskRequest = vi.fn(async () => {});
    bridge = new TaskBridge(transport as unknown as MessageTransport, onTaskRequest);
  });

  afterEach(() => {
    bridge.dispose();
  });

  it('rejects messages when bridge is disabled', async () => {
    bridge.setEnabled(false);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg());
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('rejects group messages', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ isGroup: true }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('rejects messages when no owner is configured', async () => {
    transport.emit('message', makeMsg());
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('rejects messages from non-owner senders', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('owner@s.whatsapp.net');

    transport.emit('message', makeMsg({ senderId: 'stranger@s.whatsapp.net', isFromMe: true }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('rejects messages that are not from self', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ isFromMe: false }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('processes a valid self-chat message and calls onTaskRequest', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ text: 'do something' }));
    await vi.waitFor(() => {
      expect(onTaskRequest).toHaveBeenCalledWith(
        '1234@s.whatsapp.net',
        undefined,
        'do something',
        'msg-1',
        expect.any(Number),
      );
    });
  });

  it('forwards the sender name when provided', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ senderName: 'Alice' }));
    await vi.waitFor(() => {
      expect(onTaskRequest).toHaveBeenCalledWith(
        '1234@s.whatsapp.net',
        'Alice',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  it('queues messages when the sender has an active task', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');
    bridge.setActiveTask('1234@s.whatsapp.net', 'existing-task');

    transport.emit('message', makeMsg({ text: 'queued msg' }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
    bridge.clearActiveTask('1234@s.whatsapp.net');
  });

  it('processes queued message after active task is cleared', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');
    bridge.setActiveTask('1234@s.whatsapp.net', 'task-1');

    transport.emit('message', makeMsg({ messageId: 'queued-msg', text: 'queued' }));
    await new Promise((r) => setTimeout(r, 50));

    bridge.clearActiveTask('1234@s.whatsapp.net');
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).toHaveBeenCalledOnce();
  });

  it('rejects messages that exceed the max length', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ text: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
    const msg = transport.sentMessages.find((m) => m.text.includes('too long'));
    expect(msg).toBeDefined();
  });

  it('handles onTaskRequest rejection gracefully', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');
    onTaskRequest.mockRejectedValue(new Error('task creation failed'));

    transport.emit('message', makeMsg({ text: 'will fail' }));
    await new Promise((r) => setTimeout(r, 50));

    expect(bridge.hasActiveTask('1234@s.whatsapp.net')).toBe(false);
  });

  it('supports owner LID identity', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerLid('owner-lid@lid');

    transport.emit('message', makeMsg({ senderId: 'owner-lid@lid' }));
    await vi.waitFor(() => {
      expect(onTaskRequest).toHaveBeenCalled();
    });
  });

  it('rejects non-owner when using LID identity', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerLid('owner-lid@lid');

    transport.emit('message', makeMsg({ senderId: 'stranger-lid@lid' }));
    await new Promise((r) => setTimeout(r, 50));

    expect(onTaskRequest).not.toHaveBeenCalled();
  });

  it('dispose removes the message listener', () => {
    bridge.dispose();
    const listenerCount = transport.listenerCount('message');
    expect(listenerCount).toBe(0);
  });

  it('setEnabled/getOwnerJid/getOwnerLid work correctly', () => {
    expect(bridge.getOwnerJid()).toBeNull();
    expect(bridge.getOwnerLid()).toBeNull();

    bridge.setOwnerJid('test@s.whatsapp.net');
    expect(bridge.getOwnerJid()).toBe('test@s.whatsapp.net');

    bridge.setOwnerLid('test-lid@lid');
    expect(bridge.getOwnerLid()).toBe('test-lid@lid');
  });

  it('hasActiveTask returns true when a task is set', () => {
    expect(bridge.hasActiveTask('sender-1')).toBe(false);
    bridge.setActiveTask('sender-1', 'task-1');
    expect(bridge.hasActiveTask('sender-1')).toBe(true);
    bridge.clearActiveTask('sender-1');
    expect(bridge.hasActiveTask('sender-1')).toBe(false);
  });

  it('clearActiveTask processes queued messages when queue is ready', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');
    bridge.setActiveTask('1234@s.whatsapp.net', 'task-1');

    transport.emit('message', makeMsg({ messageId: 'queued-1', text: 'first queued' }));
    await new Promise((r) => setTimeout(r, 50));

    bridge.clearActiveTask('1234@s.whatsapp.net');
    await vi.waitFor(() => {
      expect(onTaskRequest).toHaveBeenCalledWith(
        '1234@s.whatsapp.net',
        undefined,
        'first queued',
        'queued-1',
        expect.any(Number),
      );
    });
  });

  it('setSessionForSender and getSessionForSender round-trip', () => {
    expect(bridge.getSessionForSender('sender-1')).toBeNull();
    bridge.setSessionForSender('sender-1', 'sess-abc');
    expect(bridge.getSessionForSender('sender-1')).toBe('sess-abc');
  });

  it('rate limits sender after RATE_LIMIT_MAX_MESSAGES messages', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');
    onTaskRequest.mockResolvedValue(undefined);

    for (let i = 0; i < 11; i++) {
      transport.emit('message', makeMsg({ messageId: `msg-${i}`, text: `msg ${i}` }));
    }
    await new Promise((r) => setTimeout(r, 200));

    const tooFast = transport.sentMessages.find((m) =>
      m.text.includes('sending messages too quickly'),
    );
    expect(tooFast).toBeDefined();
  });

  it('triggers sanitizeString error for empty/whitespace message', async () => {
    bridge.setEnabled(true);
    bridge.setOwnerJid('1234@s.whatsapp.net');

    transport.emit('message', makeMsg({ text: '   ' }));
    await new Promise((r) => setTimeout(r, 100));

    expect(onTaskRequest).not.toHaveBeenCalled();
    const reply = transport.sentMessages.find((m) => m.text.includes('Could not process'));
    expect(reply).toBeDefined();
  });
});
