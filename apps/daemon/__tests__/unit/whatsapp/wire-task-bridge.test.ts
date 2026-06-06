import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before dynamic imports
// ---------------------------------------------------------------------------

vi.mock('@myboteam/agent-core', async () => {
  const actual =
    await vi.importActual<typeof import('@myboteam/agent-core')>('@myboteam/agent-core');
  return {
    ...actual,
    createTaskId: vi.fn(() => 'test-task-id'),
  };
});

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

class MockWhatsAppService extends EventEmitter {
  readonly channelType = 'whatsapp';
  sentMessages: Array<{ recipientId: string; text: string }> = [];

  async sendMessage(recipientId: string, text: string) {
    this.sentMessages.push({ recipientId, text });
  }

  getStatus() {
    return 'connected';
  }

  getQrCode() {
    return null;
  }

  getQrIssuedAt() {
    return null;
  }

  async connect() {}
  async disconnect() {}
  dispose() {
    this.removeAllListeners();
  }
}

class MockTaskService extends EventEmitter {
  tasks: Array<{ id: string; sessionId?: string; status: string }> = [];
  startTaskMock = vi.fn();
  /**
   * Phase 2 of the SDK cutover port: `wireTaskBridge` auto-deny routes
   * through `taskService.sendResponse` instead of the deleted
   * `permissionService.resolvePermission/resolveQuestion`. Expose a mock so
   * assertions can verify the structured payload.
   */
  sendResponseMock = vi.fn(async () => {});

  async startTask(params: { prompt: string; taskId: string; sessionId?: string; source?: string }) {
    this.startTaskMock(params);
    this.tasks.push({ id: params.taskId, status: 'running' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { id: params.taskId, status: 'running' } as any;
  }

  async sendResponse(taskId: string, response: unknown) {
    await this.sendResponseMock(taskId, response);
  }

  listTasks() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.tasks as any;
  }
}

// Request-ID prefixes used in tests below. Must match the constants exported
// from `@myboteam/agent-core/common/types/permission`; wireTaskBridge
// uses those for auto-deny classification after the Phase 2 PermissionService
// deletion. We rely on real strings rather than the mocked module's actual
// constants so the test module graph stays simple.
const TEST_FILE_PERMISSION_PREFIX = 'filereq_';
const TEST_QUESTION_PREFIX = 'questionreq_';

function createMockStorage() {
  let messagingConfig: Record<string, unknown> | null = {
    integrations: {
      whatsapp: {
        platform: 'whatsapp',
        enabled: true,
        tunnelEnabled: false,
        lastProcessedAt: 0,
        lastProcessedMessageId: null,
      },
    },
  };
  return {
    getMessagingConfig: vi.fn(() => messagingConfig),
    setMessagingConfig: vi.fn((config: Record<string, unknown>) => {
      messagingConfig = config;
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wireTaskBridge (daemon version)', () => {
  let service: MockWhatsAppService;
  let taskService: MockTaskService;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MockWhatsAppService();
    taskService = new MockTaskService();
    mockStorage = createMockStorage();
  });

  // Helper to create the bridge via dynamic import (avoids mock ordering issues).
  // Phase 2 of the SDK cutover port dropped the `permissionService` parameter
  // — wireTaskBridge now auto-denies via `taskService.sendResponse`.
  async function createBridge() {
    const { wireTaskBridge } = await import('../../../src/whatsapp/wireTaskBridge.js');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return wireTaskBridge(service as any, taskService as any, mockStorage as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  describe('permission auto-deny (P1 fix)', () => {
    it('should auto-deny file permission requests using PermissionRequest.id', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      // Simulate a message that triggers a task
      service.emit('message', {
        messageId: 'msg-1',
        senderId: '1234@s.whatsapp.net',
        text: 'test task',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      // Wait for task to start
      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Simulate a file permission request from the task.
      // TaskService emits raw PermissionRequest with id at top level.
      // Phase 2 auto-deny routes through taskService.sendResponse — the id
      // prefix gates whether wireTaskBridge treats it as auto-deniable.
      const requestId = `${TEST_FILE_PERMISSION_PREFIX}123`;
      taskService.emit('permission', {
        id: requestId,
        taskId: 'test-task-id',
        type: 'file',
        fileOperation: 'create',
        filePath: '/tmp/test.txt',
      });

      await vi.waitFor(() => {
        expect(taskService.sendResponseMock).toHaveBeenCalled();
      });
      expect(taskService.sendResponseMock).toHaveBeenCalledWith('test-task-id', {
        requestId,
        taskId: 'test-task-id',
        decision: 'deny',
      });
    }, 15000);

    it('should auto-deny question requests using PermissionRequest.id', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-2',
        senderId: '1234@s.whatsapp.net',
        text: 'another task',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Simulate a question request (Phase 2 auto-deny via sendResponse).
      const requestId = `${TEST_QUESTION_PREFIX}456`;
      taskService.emit('permission', {
        id: requestId,
        taskId: 'test-task-id',
        type: 'question',
        question: 'Which option?',
      });

      await vi.waitFor(() => {
        expect(taskService.sendResponseMock).toHaveBeenCalled();
      });
      expect(taskService.sendResponseMock).toHaveBeenCalledWith('test-task-id', {
        requestId,
        taskId: 'test-task-id',
        decision: 'deny',
      });
    });

    it('should send denial message to WhatsApp user', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-3',
        senderId: '1234@s.whatsapp.net',
        text: 'task needing permission',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      taskService.emit('permission', {
        id: `${TEST_FILE_PERMISSION_PREFIX}789`,
        taskId: 'test-task-id',
        type: 'file',
      });

      const denialMsg = service.sentMessages.find((m) =>
        m.text.includes('cannot be auto-approved'),
      );
      expect(denialMsg).toBeDefined();
    });
  });

  describe('listener cleanup', () => {
    it('should remove task listeners on complete', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      const initialListeners = taskService.listenerCount('complete');

      service.emit('message', {
        messageId: 'msg-4',
        senderId: '1234@s.whatsapp.net',
        text: 'task to complete',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Listeners should have been added
      expect(taskService.listenerCount('complete')).toBeGreaterThan(initialListeners);

      // Complete the task
      taskService.tasks[0] = { id: 'test-task-id', status: 'completed', sessionId: 'sess-1' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      // After nextTick, listeners should be cleaned up
      await new Promise((resolve) => process.nextTick(resolve));
      expect(taskService.listenerCount('complete')).toBe(initialListeners);
    });

    it('should remove task listeners on error', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      const initialListeners = taskService.listenerCount('error');

      service.emit('message', {
        messageId: 'msg-5',
        senderId: '1234@s.whatsapp.net',
        text: 'task to fail',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      taskService.emit('error', { taskId: 'test-task-id', error: 'test error' });

      expect(taskService.listenerCount('error')).toBe(initialListeners);
    });
  });

  describe('session continuity (P2 fix)', () => {
    it('should read sessionId after nextTick to allow storage update', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-6',
        senderId: '1234@s.whatsapp.net',
        text: 'session test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Simulate task-callbacks.ts behavior: complete fires, then storage updates
      taskService.emit('complete', { taskId: 'test-task-id' });

      // Simulate storage being updated synchronously after emit (like task-callbacks does)
      taskService.tasks[0] = { id: 'test-task-id', status: 'completed', sessionId: 'sess-abc' };

      // The bridge reads storage on nextTick — so it should find the sessionId
      await new Promise((resolve) => process.nextTick(resolve));

      // Verify session was stored (by checking the bridge internals via getSessionForSender)
      const nextSessionId = bridge.getSessionForSender('1234@s.whatsapp.net');
      expect(nextSessionId).toBe('sess-abc');
    });
  });

  describe('message watermark (offline dedup)', () => {
    it('should skip messages older than the stored watermark', async () => {
      // Set watermark to "now" — any message before this should be skipped
      const now = Date.now();
      mockStorage.setMessagingConfig({
        integrations: {
          whatsapp: {
            platform: 'whatsapp',
            enabled: true,
            tunnelEnabled: false,
            lastProcessedAt: now,
            lastProcessedMessageId: null,
          },
        },
      });

      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      // Send a message with timestamp BEFORE the watermark
      service.emit('message', {
        messageId: 'old-msg',
        senderId: '1234@s.whatsapp.net',
        text: 'old message',
        timestamp: now - 10_000, // 10 seconds before watermark
        isGroup: false,
        isFromMe: true,
      });

      // Give it time to process
      await new Promise((r) => setTimeout(r, 100));

      // Task should NOT have been started
      expect(taskService.startTaskMock).not.toHaveBeenCalled();
    });

    it('should process messages newer than the stored watermark', async () => {
      const now = Date.now();
      mockStorage.setMessagingConfig({
        integrations: {
          whatsapp: {
            platform: 'whatsapp',
            enabled: true,
            tunnelEnabled: false,
            lastProcessedAt: now - 60_000, // watermark is 1 minute ago
            lastProcessedMessageId: null,
          },
        },
      });

      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'new-msg',
        senderId: '1234@s.whatsapp.net',
        text: 'new message',
        timestamp: now, // newer than watermark
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });
    });

    it('should skip exact duplicate (same timestamp + messageId)', async () => {
      const now = Date.now();
      mockStorage.setMessagingConfig({
        integrations: {
          whatsapp: {
            platform: 'whatsapp',
            enabled: true,
            tunnelEnabled: false,
            lastProcessedAt: now,
            lastProcessedMessageId: 'dup-msg-id',
          },
        },
      });

      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'dup-msg-id',
        senderId: '1234@s.whatsapp.net',
        text: 'duplicate',
        timestamp: now, // exact same timestamp as watermark
        isGroup: false,
        isFromMe: true,
      });

      await new Promise((r) => setTimeout(r, 100));
      expect(taskService.startTaskMock).not.toHaveBeenCalled();
    });

    it('should advance watermark after successful task creation', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      const msgTimestamp = Date.now();
      service.emit('message', {
        messageId: 'watermark-msg',
        senderId: '1234@s.whatsapp.net',
        text: 'advance watermark',
        timestamp: msgTimestamp,
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Watermark should have been updated in storage
      expect(mockStorage.setMessagingConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.objectContaining({
            whatsapp: expect.objectContaining({
              lastProcessedAt: msgTimestamp,
              lastProcessedMessageId: 'watermark-msg',
            }),
          }),
        }),
      );
    });
  });

  describe('owner identity wiring', () => {
    it('should set ownerJid from phoneNumber event', async () => {
      const { bridge } = await createBridge();

      service.emit('phoneNumber', '5551234567');

      expect(bridge.getOwnerJid()).toBe('5551234567@s.whatsapp.net');
    });

    it('should set ownerLid from ownerLid event', async () => {
      const { bridge } = await createBridge();

      service.emit('ownerLid', 'lid-abc@lid');

      expect(bridge.getOwnerLid()).toBe('lid-abc@lid');
    });
  });

  describe('edge cases', () => {
    it('onError with non-matching taskId does not trigger sendMessage', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-edge',
        senderId: '1234@s.whatsapp.net',
        text: 'edge case test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Emit error for a DIFFERENT taskId — the handler should skip it
      const sendCount = service.sentMessages.length;
      taskService.emit('error', { taskId: 'other-task-id' });

      await new Promise((r) => setTimeout(r, 50));
      expect(service.sentMessages.length).toBe(sendCount);
    });

    it('handles startTask rejection gracefully', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      // Make the next startTask call reject
      taskService.startTask = vi.fn().mockRejectedValue(new Error('server error'));

      service.emit('message', {
        messageId: 'msg-reject',
        senderId: '1234@s.whatsapp.net',
        text: 'will reject',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      // Should have sent an error message back
      const errorReply = service.sentMessages.find((m) => m.text.includes('could not process'));
      expect(errorReply).toBeDefined();
    });

    it('permission listener ignores events with non-matching taskId', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-perm-skip',
        senderId: '1234@s.whatsapp.net',
        text: 'permission skip test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Emit a permission event for a different task — should be ignored
      const sendCount = service.sentMessages.length;
      taskService.emit('permission', { taskId: 'other-task', id: 'filereq_999' });

      await new Promise((r) => setTimeout(r, 50));
      // No new messages sent because the event was for a different task
      expect(service.sentMessages.length).toBe(sendCount);
    });

    it('complete listener ignores events with non-matching taskId', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-complete-skip',
        senderId: '1234@s.whatsapp.net',
        text: 'complete skip test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Emit complete for a different task — should be a no-op
      const initialCount = service.sentMessages.length;
      taskService.emit('complete', { taskId: 'other-task' });

      await new Promise((r) => setTimeout(r, 50));
      // No reply sent since the event was for a different task
      expect(service.sentMessages.length).toBe(initialCount);
    });

    it('truncates long assistant content in completion reply', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-truncate',
        senderId: '1234@s.whatsapp.net',
        text: 'long reply test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Send a very long assistant message (> 4096 chars)
      const longContent = 'A'.repeat(5000);
      taskService.emit('message', {
        taskId: 'test-task-id',
        messages: [
          {
            id: 'msg-1',
            type: 'assistant',
            content: longContent,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      // Now complete the task
      taskService.tasks[0] = { id: 'test-task-id', status: 'completed' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

      // The reply should have a truncation suffix
      const reply = service.sentMessages.find((m) => m.text.includes('[Response truncated]'));
      expect(reply).toBeDefined();
    });

    it('handles missing whatsapp integration in setWatermark gracefully', async () => {
      // Storage config without whatsapp integration
      mockStorage.setMessagingConfig({ integrations: {} });

      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-no-wa-config',
        senderId: '1234@s.whatsapp.net',
        text: 'no wa config',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      // Task should still start successfully — setWatermark just returns early
      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });
    });

    it('onMessage handler ignores events with non-matching taskId', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-msg-skip',
        senderId: '1234@s.whatsapp.net',
        text: 'message skip test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Emit a message event for a different task — the handler should skip it
      taskService.emit('message', {
        taskId: 'unrelated-task',
        messages: [{ type: 'assistant', content: 'should be ignored' }],
      });

      // No error thrown — the handler just returns early
    });

    it('uses default completion text when no assistant messages were received', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-default-reply',
        senderId: '1234@s.whatsapp.net',
        text: 'default reply test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Complete the task WITHOUT emitting any assistant message first
      taskService.tasks[0] = { id: 'test-task-id', status: 'completed' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

      // Should send "Task completed successfully." since no assistant content
      const reply = service.sentMessages.find((m) =>
        m.text.includes('Task completed successfully'),
      );
      expect(reply).toBeDefined();
    });

    it("truncates long task text in the 'Task started' confirmation message", async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      const longText = 'A'.repeat(100);
      service.emit('message', {
        messageId: 'msg-long-text',
        senderId: '1234@s.whatsapp.net',
        text: longText,
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      // The "Task started" message should contain the ellipsis from truncation
      const reply = service.sentMessages.find((m) => m.text.includes('\u2026'));
      expect(reply).toBeDefined();
    });

    it('uses fallback text for non-completed task status in completion reply', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-fallback-status',
        senderId: '1234@s.whatsapp.net',
        text: 'fallback status',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Task status is still 'running' (not 'completed') when complete fires
      taskService.tasks[0] = { id: 'test-task-id', status: 'interrupted' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

      const reply = service.sentMessages.find((m) => m.text.includes('Task finished with status'));
      expect(reply).toBeDefined();
    });

    it('ignores permission request without an ID', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-no-perm-id',
        senderId: '1234@s.whatsapp.net',
        text: 'no perm id',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Permission with no ID — handler returns early without denying
      const sendResponseCalls = taskService.sendResponseMock.mock.calls.length;
      taskService.emit('permission', { taskId: 'test-task-id' });

      await new Promise((r) => setTimeout(r, 50));
      expect(taskService.sendResponseMock.mock.calls.length).toBe(sendResponseCalls);
    });

    it('ignores permission request with unrecognized prefix', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-unknown-prefix',
        senderId: '1234@s.whatsapp.net',
        text: 'unknown prefix',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Permission with an ID that doesn't match file or question prefix
      const sendResponseCalls = taskService.sendResponseMock.mock.calls.length;
      taskService.emit('permission', { id: 'unknown_prefix_123', taskId: 'test-task-id' });

      await new Promise((r) => setTimeout(r, 50));
      expect(taskService.sendResponseMock.mock.calls.length).toBe(sendResponseCalls);
    });

    it('sends progress notification for assistant messages (short preview)', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-progress',
        senderId: '1234@s.whatsapp.net',
        text: 'progress test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Send a SHORT assistant message (< 200 chars — no truncation)
      taskService.emit('message', {
        taskId: 'test-task-id',
        messages: [
          {
            id: 'm1',
            type: 'assistant',
            content: 'Short reply',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await new Promise((r) => setTimeout(r, 50));

      const progressReply = service.sentMessages.find((m) => m.text.includes('\u23f3'));
      expect(progressReply).toBeDefined();
    });

    it('does not send duplicate progress within rate limit window', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-progress-limit',
        senderId: '1234@s.whatsapp.net',
        text: 'progress limit test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // First assistant message triggers progress
      taskService.emit('message', {
        taskId: 'test-task-id',
        messages: [
          {
            id: 'm1',
            type: 'assistant',
            content: 'First progress',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await new Promise((r) => setTimeout(r, 50));
      // Count only messages containing "First progress" or "Second progress"
      const progressMessages = service.sentMessages.filter(
        (m) => m.text.includes('First progress') || m.text.includes('Second progress'),
      );

      // Second assistant message IMMEDIATELY — should NOT send progress (rate limited)
      taskService.emit('message', {
        taskId: 'test-task-id',
        messages: [
          {
            id: 'm2',
            type: 'assistant',
            content: 'Second progress',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await new Promise((r) => setTimeout(r, 50));
      const progressMessagesAfter = service.sentMessages.filter(
        (m) => m.text.includes('First progress') || m.text.includes('Second progress'),
      );

      // Only one progress notification should have been sent (the first one)
      expect(progressMessagesAfter.length).toBe(1);
      expect(progressMessages.length).toBe(1);
    });

    it('handles non-Error rejection from sendResponse gracefully', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-non-error-reject',
        senderId: '1234@s.whatsapp.net',
        text: 'non-error reject',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Make sendResponse reject with a STRING (not an Error instance)
      taskService.sendResponseMock.mockRejectedValue('network failure string');

      taskService.emit('permission', {
        id: 'filereq_nonerror',
        taskId: 'test-task-id',
        type: 'file',
      });

      await new Promise((r) => setTimeout(r, 50));

      // The warning is logged — no unhandled rejection
      expect(taskService.sendResponseMock).toHaveBeenCalled();
    });

    it('handles task with no status in completion reply', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-no-status',
        senderId: '1234@s.whatsapp.net',
        text: 'no status',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Task with NO status property
      taskService.tasks[0] = { id: 'test-task-id' } as { id: string; status?: string };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

      // Should use 'unknown' as fallback
      const reply = service.sentMessages.find((m) => m.text.includes('unknown'));
      expect(reply).toBeDefined();
    });

    it('logs warning when auto-deny sendResponse fails', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-deny-fail',
        senderId: '1234@s.whatsapp.net',
        text: 'deny fail test',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

      // Make sendResponse reject
      taskService.sendResponseMock.mockRejectedValue(new Error('network error'));

      // Trigger a permission request — auto-deny will call sendResponse which will reject
      taskService.emit('permission', {
        id: 'filereq_123',
        taskId: 'test-task-id',
        type: 'file',
      });

      await new Promise((r) => setTimeout(r, 50));

      // The rejection is caught and logged — no unhandled rejection
      // sendResponseMock should have been called (even though it rejected)
      expect(taskService.sendResponseMock).toHaveBeenCalled();
    });
  });
});
