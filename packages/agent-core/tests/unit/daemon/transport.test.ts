import { describe, expect, it } from 'vitest';
import type { JsonRpcMessage } from '../../../src/common/types/daemon.js';
import { createInProcessTransportPair } from '../../../src/daemon/transport.js';

describe('createInProcessTransportPair', () => {
  it('should return both server and client transports', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    expect(serverTransport).toBeDefined();
    expect(clientTransport).toBeDefined();
    expect(serverTransport.send).toBeInstanceOf(Function);
    expect(serverTransport.onMessage).toBeInstanceOf(Function);
    expect(serverTransport.close).toBeInstanceOf(Function);
    expect(clientTransport.send).toBeInstanceOf(Function);
    expect(clientTransport.onMessage).toBeInstanceOf(Function);
    expect(clientTransport.close).toBeInstanceOf(Function);
  });

  it('should deliver messages from server to client', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const received: JsonRpcMessage[] = [];
    clientTransport.onMessage((msg) => {
      received.push(msg);
    });
    const message: JsonRpcMessage = { jsonrpc: '2.0', method: 'test', id: 1 };
    serverTransport.send(message);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(message);
  });

  it('should deliver messages from client to server', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const received: JsonRpcMessage[] = [];
    serverTransport.onMessage((msg) => {
      received.push(msg);
    });
    const message: JsonRpcMessage = { jsonrpc: '2.0', method: 'test', id: 1 };
    clientTransport.send(message);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(message);
  });

  it('should support multiple client handlers', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const received1: JsonRpcMessage[] = [];
    const received2: JsonRpcMessage[] = [];
    clientTransport.onMessage((msg) => {
      received1.push(msg);
    });
    clientTransport.onMessage((msg) => {
      received2.push(msg);
    });
    serverTransport.send({ jsonrpc: '2.0', method: 'test', id: 1 });
    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);
  });

  it('should support multiple server handlers', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const received1: JsonRpcMessage[] = [];
    const received2: JsonRpcMessage[] = [];
    serverTransport.onMessage((msg) => {
      received1.push(msg);
    });
    serverTransport.onMessage((msg) => {
      received2.push(msg);
    });
    clientTransport.send({ jsonrpc: '2.0', method: 'test', id: 1 });
    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);
  });

  it('should stop delivering messages after close', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const received: JsonRpcMessage[] = [];
    clientTransport.onMessage((msg) => {
      received.push(msg);
    });
    serverTransport.close();
    serverTransport.send({ jsonrpc: '2.0', method: 'test', id: 1 });
    expect(received).toHaveLength(0);
  });

  it('should clear handlers on close', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const serverReceived: JsonRpcMessage[] = [];
    const clientReceived: JsonRpcMessage[] = [];
    serverTransport.onMessage((msg) => {
      serverReceived.push(msg);
    });
    clientTransport.onMessage((msg) => {
      clientReceived.push(msg);
    });
    serverTransport.close();
    clientTransport.send({ jsonrpc: '2.0', method: 'test', id: 1 });
    serverTransport.send({ jsonrpc: '2.0', method: 'test', id: 2 });
    expect(serverReceived).toHaveLength(0);
    expect(clientReceived).toHaveLength(0);
  });

  it('should deliver messages bidirectionally', () => {
    const { serverTransport, clientTransport } = createInProcessTransportPair();
    const serverReceived: JsonRpcMessage[] = [];
    const clientReceived: JsonRpcMessage[] = [];
    serverTransport.onMessage((msg) => {
      serverReceived.push(msg);
    });
    clientTransport.onMessage((msg) => {
      clientReceived.push(msg);
    });
    serverTransport.send({ jsonrpc: '2.0', method: 'from-server', id: 1 });
    clientTransport.send({ jsonrpc: '2.0', method: 'from-client', id: 2 });
    expect(serverReceived).toHaveLength(1);
    expect(serverReceived[0]?.method).toBe('from-client');
    expect(clientReceived).toHaveLength(1);
    expect(clientReceived[0]?.method).toBe('from-server');
  });
});
