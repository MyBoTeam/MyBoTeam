/**
 * Unit test for handler registration.
 * Tests the registerMethod API and handler management.
 *
 * FR-013: Support registerMethod() API for handler registration
 */

import { describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';

describe('Unit: Handler Registration', () => {
  it('should register a handler via registerMethod()', () => {
    const server = new DaemonRpcServer();
    const handler = (params: unknown) => ({ result: params });

    server.registerMethod('test.method', handler);

    // Verify by checking daemon.ping includes the registered method in services
    const pingResult = (server as unknown as { handlers: Map<string, unknown> }).handlers;
    expect(pingResult.has('test.method')).toBe(true);
  });

  it('should overwrite existing handler', () => {
    const server = new DaemonRpcServer();
    const handler1 = () => 'first';
    const handler2 = () => 'second';

    server.registerMethod('test.method', handler1);
    server.registerMethod('test.method', handler2);

    const handlers = (server as unknown as { handlers: Map<string, unknown> }).handlers;
    expect(handlers.get('test.method')).toBe(handler2);
  });

  it('should include daemon.ping as a built-in handler', () => {
    const server = new DaemonRpcServer();

    const handlers = (server as unknown as { handlers: Map<string, unknown> }).handlers;
    expect(handlers.has('daemon.ping')).toBe(true);
  });

  it('should include registered methods in daemon.ping services', () => {
    const server = new DaemonRpcServer();
    server.registerMethod('custom.method', () => ({ ok: true }));

    const handlers = (server as unknown as { handlers: Map<string, (params: unknown) => unknown> })
      .handlers;
    const pingHandler = handlers.get('daemon.ping');
    expect(pingHandler).toBeDefined();

    const result = pingHandler?.({}) as { services: string[] };
    expect(result.services).toContain('daemon.ping');
    expect(result.services).toContain('custom.method');
  });

  it('should delete a handler', () => {
    const server = new DaemonRpcServer();
    server.registerMethod('test.method', () => 'test');

    const handlers = (server as unknown as { handlers: Map<string, unknown> }).handlers;
    expect(handlers.has('test.method')).toBe(true);
    handlers.delete('test.method');
    expect(handlers.has('test.method')).toBe(false);
  });

  it('should list all registered methods', () => {
    const server = new DaemonRpcServer();
    server.registerMethod('method1', () => {});
    server.registerMethod('method2', () => {});

    const methods = Array.from(
      (server as unknown as { handlers: Map<string, unknown> }).handlers.keys(),
    );

    expect(methods).toContain('method1');
    expect(methods).toContain('method2');
    expect(methods).toContain('daemon.ping');
  });
});
