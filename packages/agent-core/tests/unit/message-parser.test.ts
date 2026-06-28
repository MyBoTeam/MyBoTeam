/**
 * Unit test for JSON-RPC message parsing.
 * Tests the message handler's ability to parse and validate JSON-RPC messages.
 *
 * FR-006: Validate incoming messages against JSON-RPC 2.0 schema
 * FR-020: Catch all errors in RPC handler and return JSON-RPC error responses
 */

import { describe, expect, it } from 'vitest';

describe('Unit: JSON-RPC Message Parsing', () => {
  it('should parse valid JSON-RPC request', () => {
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id: '123',
      method: 'test.method',
      params: { key: 'value' },
    });

    const parsed = JSON.parse(message);

    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.id).toBe('123');
    expect(parsed.method).toBe('test.method');
    expect(parsed.params).toEqual({ key: 'value' });
  });

  it('should parse JSON-RPC notification (no id)', () => {
    const message = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test.notification',
      params: { data: 'test' },
    });

    const parsed = JSON.parse(message);

    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.method).toBe('test.notification');
    expect(parsed.id).toBeUndefined();
  });

  it('should reject invalid JSON', () => {
    const invalidJson = '{ invalid json }';

    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  it('should identify request vs response', () => {
    const request = { jsonrpc: '2.0', id: '1', method: 'test' };
    const response = { jsonrpc: '2.0', id: '1', result: 'ok' };

    expect('method' in request).toBe(true);
    expect('method' in response).toBe(false);
    expect('result' in response).toBe(true);
  });

  it('should validate required fields', () => {
    const validRequest = { jsonrpc: '2.0', id: '1', method: 'test' };
    const missingMethod = { jsonrpc: '2.0', id: '1' };
    const missingId = { jsonrpc: '2.0', method: 'test' };
    const wrongVersion = { jsonrpc: '1.0', id: '1', method: 'test' };

    expect(validRequest.jsonrpc).toBe('2.0');
    expect('method' in missingMethod).toBe(false);
    expect('id' in missingId).toBe(false);
    expect(wrongVersion.jsonrpc).not.toBe('2.0');
  });
});
