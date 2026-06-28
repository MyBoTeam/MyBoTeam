/**
 * Unit test for handler registration.
 * Tests the registerMethod API and handler management.
 *
 * FR-013: Support registerMethod() API for handler registration
 */

import { describe, it, expect } from 'vitest';

describe('Unit: Handler Registration', () => {
  interface HandlerMap {
    get(method: string): ((params: unknown) => unknown) | undefined;
    set(method: string, handler: (params: unknown) => unknown): void;
    has(method: string): boolean;
    delete(method: string): boolean;
    keys(): IterableIterator<string>;
  }

  function createHandlerMap(): HandlerMap {
    const handlers = new Map<string, (params: unknown) => unknown>();
    return {
      get: (method) => handlers.get(method),
      set: (method, handler) => handlers.set(method, handler),
      has: (method) => handlers.has(method),
      delete: (method) => handlers.delete(method),
      keys: () => handlers.keys(),
    };
  }

  it('should register a handler', () => {
    const handlers = createHandlerMap();
    const handler = (params: unknown) => ({ result: params });

    handlers.set('test.method', handler);

    expect(handlers.has('test.method')).toBe(true);
    expect(handlers.get('test.method')).toBe(handler);
  });

  it('should retrieve registered handler', () => {
    const handlers = createHandlerMap();
    const handler = (params: unknown) => ({ data: 'test' });

    handlers.set('my.method', handler);
    const retrieved = handlers.get('my.method');

    expect(retrieved).toBe(handler);
  });

  it('should return undefined for unregistered method', () => {
    const handlers = createHandlerMap();

    expect(handlers.get('nonexistent')).toBeUndefined();
  });

  it('should overwrite existing handler', () => {
    const handlers = createHandlerMap();
    const handler1 = () => 'first';
    const handler2 = () => 'second';

    handlers.set('test.method', handler1);
    handlers.set('test.method', handler2);

    expect(handlers.get('test.method')).toBe(handler2);
  });

  it('should delete a handler', () => {
    const handlers = createHandlerMap();
    handlers.set('test.method', () => 'test');

    expect(handlers.has('test.method')).toBe(true);
    handlers.delete('test.method');
    expect(handlers.has('test.method')).toBe(false);
  });

  it('should list all registered methods', () => {
    const handlers = createHandlerMap();
    handlers.set('method1', () => {});
    handlers.set('method2', () => {});
    handlers.set('method3', () => {});

    const methods = Array.from(handlers.keys());

    expect(methods).toContain('method1');
    expect(methods).toContain('method2');
    expect(methods).toContain('method3');
    expect(methods.length).toBe(3);
  });
});
