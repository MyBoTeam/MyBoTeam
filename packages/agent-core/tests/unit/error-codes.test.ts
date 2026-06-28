/**
 * Unit test for error code generation.
 * Tests the JSON-RPC error code constants and error response structure.
 *
 * FR-004: Return error responses with structured codes per JSON-RPC 2.0 specification
 * SC-003: Error responses follow JSON-RPC 2.0 error code specification
 */

import { describe, expect, it } from 'vitest';
import { JSON_RPC_ERRORS } from '../../../types/src/daemon.js';

describe('Unit: Error Code Generation', () => {
  it('should have correct PARSE_ERROR code', () => {
    expect(JSON_RPC_ERRORS.PARSE_ERROR).toBe(-32700);
  });

  it('should have correct INVALID_REQUEST code', () => {
    expect(JSON_RPC_ERRORS.INVALID_REQUEST).toBe(-32600);
  });

  it('should have correct METHOD_NOT_FOUND code', () => {
    expect(JSON_RPC_ERRORS.METHOD_NOT_FOUND).toBe(-32601);
  });

  it('should have correct INVALID_PARAMS code', () => {
    expect(JSON_RPC_ERRORS.INVALID_PARAMS).toBe(-32602);
  });

  it('should have correct INTERNAL_ERROR code', () => {
    expect(JSON_RPC_ERRORS.INTERNAL_ERROR).toBe(-32603);
  });

  it('should create valid error response structure', () => {
    const errorResponse = {
      jsonrpc: '2.0',
      id: '123',
      error: {
        code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
        message: 'Method not found: test.method',
      },
    };

    expect(errorResponse.jsonrpc).toBe('2.0');
    expect(errorResponse.id).toBe('123');
    expect(errorResponse.error.code).toBe(-32601);
    expect(errorResponse.error.message).toContain('Method not found');
  });

  it('should include optional data in error response', () => {
    const errorResponse = {
      jsonrpc: '2.0',
      id: '456',
      error: {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Invalid params',
        data: { field: 'name', reason: 'required' },
      },
    };

    expect(errorResponse.error.data).toBeDefined();
    expect((errorResponse.error.data as { field: string }).field).toBe('name');
  });
});
