import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { registerTaskEventForwarding } from '../../src/task-event-forwarding.js';

describe('registerTaskEventForwarding', () => {
  it('should forward task progress events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    const services = { rpc, taskService, healthService, whatsappService } as never;

    registerTaskEventForwarding(services);

    taskService.emit('progress', { taskId: 't1', stage: 'test' });
    expect(rpc.notify).toHaveBeenCalledWith('task.progress', { taskId: 't1', stage: 'test' });
  });

  it('should forward task message events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('message', { taskId: 't1', messages: [] });
    expect(rpc.notify).toHaveBeenCalledWith('task.message', { taskId: 't1', messages: [] });
  });

  it('should forward task complete events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('complete', { taskId: 't1', result: {} });
    expect(rpc.notify).toHaveBeenCalledWith('task.complete', { taskId: 't1', result: {} });
  });

  it('should forward task error events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('error', { taskId: 't1' });
    expect(rpc.notify).toHaveBeenCalledWith('task.error', { taskId: 't1' });
  });

  it('should forward permission request events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('permission', { taskId: 't1', requestId: 'r1' });
    expect(rpc.notify).toHaveBeenCalledWith('permission.request', {
      taskId: 't1',
      requestId: 'r1',
    });
  });

  it('should forward status change and update health service', () => {
    const taskService = Object.assign(new EventEmitter(), { getActiveTaskCount: vi.fn(() => 3) });
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('statusChange', { taskId: 't1', status: 'running' });
    expect(healthService.setActiveTaskCount).toHaveBeenCalledWith(3);
    expect(rpc.notify).toHaveBeenCalledWith('task.statusChange', {
      taskId: 't1',
      status: 'running',
    });
  });

  it('should forward todo update events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('todo:update', { taskId: 't1', todos: [] });
    expect(rpc.notify).toHaveBeenCalledWith('todo.update', { taskId: 't1', todos: [] });
  });

  it('should forward auth error events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('auth:error', { taskId: 't1', providerId: 'anthropic', message: 'expired' });
    expect(rpc.notify).toHaveBeenCalledWith('auth.error', {
      taskId: 't1',
      providerId: 'anthropic',
      message: 'expired',
    });
  });

  it('should forward browser frame events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('browser:frame', { taskId: 't1' });
    expect(rpc.notify).toHaveBeenCalledWith('browser.frame', { taskId: 't1' });
  });

  it('should forward summary events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    taskService.emit('summary', { taskId: 't1', summary: 'done' });
    expect(rpc.notify).toHaveBeenCalledWith('task.summary', { taskId: 't1', summary: 'done' });
  });

  it('should forward whatsapp QR events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    whatsappService.emit('qr', 'qr-code-data');
    expect(rpc.notify).toHaveBeenCalledWith('whatsapp.qr', { qr: 'qr-code-data' });
  });

  it('should forward whatsapp status events', () => {
    const taskService = new EventEmitter();
    const whatsappService = new EventEmitter();
    const healthService = { setActiveTaskCount: vi.fn() };
    const rpc = { notify: vi.fn() };
    registerTaskEventForwarding({ rpc, taskService, healthService, whatsappService } as never);

    whatsappService.emit('status', 'connected');
    expect(rpc.notify).toHaveBeenCalledWith('whatsapp.status', { status: 'connected' });
  });
});
