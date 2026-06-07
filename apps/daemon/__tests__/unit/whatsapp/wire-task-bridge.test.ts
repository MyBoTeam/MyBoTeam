import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@myboteam/agent-core', async () => {
  const actual =
    await vi.importActual<typeof import('@myboteam/agent-core')>('@myboteam/agent-core');
  return {
    ...actual,
    createTaskId: vi.fn(() => 'test-task-id'),
  };
});

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

  sendResponseMock = vi.fn(async () => {});

  async startTask(params: { prompt: string; taskId: string; sessionId?: string; source?: string }) {
    this.startTaskMock(params);
    this.tasks.push({ id: params.taskId, status: 'running' });

    return { id: params.taskId, status: 'running' } as any;
  }

  async sendResponse(taskId: string, response: unknown) {
    await this.sendResponseMock(taskId, response);
  }

  listTasks() {
    return this.tasks as any;
  }
}

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

  async function createBridge() {
    const { wireTaskBridge } = await import('../../../src/whatsapp/wireTaskBridge.js');

    return wireTaskBridge(service as any, taskService as any, mockStorage as any);
  }

  describe('permission auto-deny (P1 fix)', () => {
    it('should auto-deny file permission requests using PermissionRequest.id', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

      service.emit('message', {
        messageId: 'msg-1',
        senderId: '1234@s.whatsapp.net',
        text: 'test task',
        timestamp: Date.now(),
        isGroup: false,
        isFromMe: true,
      });

      await vi.waitFor(() => {
        expect(taskService.startTaskMock).toHaveBeenCalled();
      });

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

      expect(taskService.listenerCount('complete')).toBeGreaterThan(initialListeners);

      taskService.tasks[0] = { id: 'test-task-id', status: 'completed', sessionId: 'sess-1' };
      taskService.emit('complete', { taskId: 'test-task-id' });

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

      taskService.emit('complete', { taskId: 'test-task-id' });

      taskService.tasks[0] = { id: 'test-task-id', status: 'completed', sessionId: 'sess-abc' };

      await new Promise((resolve) => process.nextTick(resolve));

      const nextSessionId = bridge.getSessionForSender('1234@s.whatsapp.net');
      expect(nextSessionId).toBe('sess-abc');
    });
  });

  describe('message watermark (offline dedup)', () => {
    it('should skip messages older than the stored watermark', async () => {
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

      service.emit('message', {
        messageId: 'old-msg',
        senderId: '1234@s.whatsapp.net',
        text: 'old message',
        timestamp: now - 10_000,
        isGroup: false,
        isFromMe: true,
      });

      await new Promise((r) => setTimeout(r, 100));

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
            lastProcessedAt: now - 60_000,
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
        timestamp: now,
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
        timestamp: now,
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

      const sendCount = service.sentMessages.length;
      taskService.emit('error', { taskId: 'other-task-id' });

      await new Promise((r) => setTimeout(r, 50));
      expect(service.sentMessages.length).toBe(sendCount);
    });

    it('handles startTask rejection gracefully', async () => {
      const { bridge } = await createBridge();
      bridge.setEnabled(true);
      bridge.setOwnerJid('1234@s.whatsapp.net');

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

      const sendCount = service.sentMessages.length;
      taskService.emit('permission', { taskId: 'other-task', id: 'filereq_999' });

      await new Promise((r) => setTimeout(r, 50));

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

      const initialCount = service.sentMessages.length;
      taskService.emit('complete', { taskId: 'other-task' });

      await new Promise((r) => setTimeout(r, 50));

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

      taskService.tasks[0] = { id: 'test-task-id', status: 'completed' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

      const reply = service.sentMessages.find((m) => m.text.includes('[Response truncated]'));
      expect(reply).toBeDefined();
    });

    it('handles missing whatsapp integration in setWatermark gracefully', async () => {
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

      taskService.emit('message', {
        taskId: 'unrelated-task',
        messages: [{ type: 'assistant', content: 'should be ignored' }],
      });
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

      taskService.tasks[0] = { id: 'test-task-id', status: 'completed' };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

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

      const progressMessages = service.sentMessages.filter(
        (m) => m.text.includes('First progress') || m.text.includes('Second progress'),
      );

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

      taskService.sendResponseMock.mockRejectedValue('network failure string');

      taskService.emit('permission', {
        id: 'filereq_nonerror',
        taskId: 'test-task-id',
        type: 'file',
      });

      await new Promise((r) => setTimeout(r, 50));

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

      taskService.tasks[0] = { id: 'test-task-id' } as { id: string; status?: string };
      taskService.emit('complete', { taskId: 'test-task-id' });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 50));

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

      taskService.sendResponseMock.mockRejectedValue(new Error('network error'));

      taskService.emit('permission', {
        id: 'filereq_123',
        taskId: 'test-task-id',
        type: 'file',
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(taskService.sendResponseMock).toHaveBeenCalled();
    });
  });
});
