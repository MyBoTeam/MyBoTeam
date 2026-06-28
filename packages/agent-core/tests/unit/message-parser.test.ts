/**
 * Unit test for JSON-RPC message parsing.
 * Tests the message handler's ability to parse and validate JSON-RPC messages.
 *
 * FR-006: Validate incoming messages against JSON-RPC 2.0 schema
 * FR-020: Catch all errors in RPC handler and return JSON-RPC error responses
 */

import { describe, expect, it } from 'vitest';
import type { RpcClient } from '../../src/daemon/rpc-message-handler.js';
import { handleRpcLine } from '../../src/daemon/rpc-message-handler.js';

function createMockClient(): { client: RpcClient; responses: string[] } {
  const responses: string[] = [];
  const client: RpcClient = {
    id: 'test-client',
    socket: {
      destroyed: false,
      write: (data: string) => {
        responses.push(data);
        return true;
      },
    } as unknown as RpcClient['socket'],
  };
  return { client, responses };
}

describe('Unit: JSON-RPC Message Parsing', () => {
  it('should parse and handle valid JSON-RPC request via handleRpcLine', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map([['test.method', (params: unknown) => ({ echo: params })]]);

    const message = JSON.stringify({
      jsonrpc: '2.0',
      id: '123',
      method: 'test.method',
      params: { key: 'value' },
    });

    await handleRpcLine(client, message, handlers);

    expect(responses).toHaveLength(1);
    const response = JSON.parse(responses[0]);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe('123');
    expect(response.result).toEqual({ echo: { key: 'value' } });
  });

  it('should drop JSON-RPC notification (no id) silently', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map([['test.notification', () => ({})]]);

    const message = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test.notification',
      params: { data: 'test' },
    });

    await handleRpcLine(client, message, handlers);

    expect(responses).toHaveLength(0);
  });

  it('should return PARSE_ERROR for invalid JSON', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map<string, (params: unknown) => unknown>();

    await handleRpcLine(client, '{ invalid json }', handlers);

    expect(responses).toHaveLength(1);
    const response = JSON.parse(responses[0]);
    expect(response.error.code).toBe(-32700);
    expect(response.error.message).toBe('Parse error');
  });

  it('should return INVALID_REQUEST for non-object messages', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map<string, (params: unknown) => unknown>();

    await handleRpcLine(client, '"just a string"', handlers);

    expect(responses).toHaveLength(1);
    const response = JSON.parse(responses[0]);
    expect(response.error.code).toBe(-32600);
    expect(response.error.message).toContain('Invalid request');
  });

  it('should return METHOD_NOT_FOUND for unregistered methods', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map<string, (params: unknown) => unknown>();

    const message = JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'nonexistent.method',
    });

    await handleRpcLine(client, message, handlers);

    expect(responses).toHaveLength(1);
    const response = JSON.parse(responses[0]);
    expect(response.error.code).toBe(-32601);
    expect(response.error.message).toContain('Method not found');
  });

  it('should return INTERNAL_ERROR when handler throws', async () => {
    const { client, responses } = createMockClient();
    const handlers = new Map([
      [
        'failing.method',
        () => {
          throw new Error('handler failed');
        },
      ],
    ]);

    const message = JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'failing.method',
    });

    await handleRpcLine(client, message, handlers);

    expect(responses).toHaveLength(1);
    const response = JSON.parse(responses[0]);
    expect(response.error.code).toBe(-32603);
    expect(response.error.message).toBe('handler failed');
  });
});
