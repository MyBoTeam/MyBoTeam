import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type WsEventListener = (event: { data?: string; type?: string }) => void;

function createMockWs() {
  const handlers: {
    open: WsEventListener[];
    error: WsEventListener[];
    message: WsEventListener[];
    close: WsEventListener[];
  } = { open: [], error: [], message: [], close: [] };

  return {
    readyState: 0,
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn((event: string, handler: WsEventListener) => {
      if (event === 'open') handlers.open.push(handler);
      if (event === 'error') handlers.error.push(handler);
      if (event === 'message') handlers.message.push(handler);
      if (event === 'close') handlers.close.push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: WsEventListener) => {
      if (event === 'open')
        handlers.open = handlers.open.filter((h: WsEventListener) => h !== handler);
      if (event === 'error')
        handlers.error = handlers.error.filter((h: WsEventListener) => h !== handler);
    }),
    _openHandlers: handlers.open,
    _errorHandlers: handlers.error,
    _messageHandlers: handlers.message,
    _closeHandlers: handlers.close,
  };
}

let mockWs: ReturnType<typeof createMockWs>;

beforeEach(() => {
  mockWs = createMockWs();
  function WebSocketMock(this: WebSocket, _url: string) {
    mockWs.readyState = 0;
    return mockWs as unknown as WebSocket;
  }
  WebSocketMock.CONNECTING = 0;
  WebSocketMock.OPEN = 1;
  WebSocketMock.CLOSING = 2;
  WebSocketMock.CLOSED = 3;
  vi.stubGlobal('WebSocket', WebSocketMock as unknown as typeof WebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

import { CdpClient } from '@main/services/cdp-client';

function simulateOpen(): void {
  mockWs.readyState = 1;
  for (const h of mockWs._openHandlers) h({ type: 'open' });
}

function simulateError(): void {
  for (const h of mockWs._errorHandlers) h({ type: 'error' });
}

function simulateMessage(data: string): void {
  for (const h of mockWs._messageHandlers) h({ data });
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('CdpClient', () => {
  let client: CdpClient;

  beforeEach(() => {
    client = new CdpClient();
  });

  describe('connect', () => {
    it('should connect to a CDP endpoint', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      expect(mockWs.readyState).toBe(1);
    });

    it('should reject on connection error', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateError();

      await expect(connectPromise).rejects.toThrow('Failed to connect to CDP endpoint');
    });
  });

  describe('sendCommand', () => {
    it('should throw if not connected', async () => {
      await expect(client.sendCommand('Test.method')).rejects.toThrow(
        'CDP websocket is not connected',
      );
    });

    it('should send a command and resolve with result', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Target.attachToTarget', { targetId: 'abc' });
      const sentPayload = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentPayload).toMatchObject({
        id: 1,
        method: 'Target.attachToTarget',
        params: { targetId: 'abc' },
      });

      simulateMessage(JSON.stringify({ id: 1, result: { sessionId: 'sess-1' } }));
      const result = await cmdPromise;
      expect(result).toEqual({ sessionId: 'sess-1' });
    });

    it('should include sessionId when provided', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Page.navigate', { url: 'about:blank' }, 'sess-1');
      const sentPayload = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentPayload).toMatchObject({
        id: 1,
        method: 'Page.navigate',
        params: { url: 'about:blank' },
        sessionId: 'sess-1',
      });
      simulateMessage(JSON.stringify({ id: 1, result: {} }));
      await cmdPromise;
    });

    it('should reject on command error', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Test.method');
      simulateMessage(JSON.stringify({ id: 1, error: { message: 'Method not found' } }));
      await expect(cmdPromise).rejects.toThrow('Method not found');
    });

    it('should reject on timeout', async () => {
      vi.useFakeTimers();
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Test.method');
      vi.advanceTimersByTime(10001);
      await expect(cmdPromise).rejects.toThrow('CDP command timed out');
      vi.useRealTimers();
    });
  });

  describe('onEvent', () => {
    it('should register event listeners and receive messages', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const listener = vi.fn();
      client.onEvent(listener);

      simulateMessage(JSON.stringify({ method: 'Page.frameNavigated', params: {} }));
      await tick();

      expect(listener).toHaveBeenCalledWith({
        method: 'Page.frameNavigated',
        params: {},
      });
    });

    it('should not dispatch command responses to event listeners', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const listener = vi.fn();
      client.onEvent(listener);

      simulateMessage(JSON.stringify({ id: 1, result: {} }));
      await tick();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing listeners', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const listener = vi.fn();
      const unsubscribe = client.onEvent(listener);

      simulateMessage(JSON.stringify({ method: 'test', params: {} }));
      await tick();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      listener.mockClear();

      simulateMessage(JSON.stringify({ method: 'test', params: {} }));
      await tick();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should ignore unparseable messages', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const listener = vi.fn();
      client.onEvent(listener);

      simulateMessage('not json');
      await tick();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should ignore responses with unknown ids', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      simulateMessage(JSON.stringify({ id: 999, result: {} }));
      await tick();
    });
  });

  describe('disconnect', () => {
    it('should close the websocket and reject pending', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Test.method');
      await client.disconnect();

      expect(mockWs.close).toHaveBeenCalled();
      await expect(cmdPromise).rejects.toThrow('CDP disconnected');
    });

    it('should handle disconnect when not connected', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('websocket close events', () => {
    it('should reject pending commands on close', async () => {
      const connectPromise = client.connect('ws://localhost:9222');
      simulateOpen();
      await connectPromise;

      const cmdPromise = client.sendCommand('Test.method');
      for (const h of mockWs._closeHandlers) h({ type: 'close' });

      await expect(cmdPromise).rejects.toThrow('CDP websocket closed');
    });
  });
});
