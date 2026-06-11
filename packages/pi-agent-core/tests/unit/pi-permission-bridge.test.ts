import { describe, expect, it } from 'vitest';
import {
  createPiToolPermissionDecision,
  mapPermissionResponseToPiToolResult,
} from '../../src/tools/pi-permission-bridge.js';

describe('Pi permission bridge', () => {
  it('creates current permission requests for high-risk tools', () => {
    const decision = createPiToolPermissionDecision({
      requestId: 'perm-1',
      taskId: 'task-1',
      toolName: 'shell',
      toolInput: { command: 'deploy' },
      risk: 'high',
      createdAt: '2026-06-11T08:00:00.000Z',
    });

    expect(decision).toEqual({
      type: 'request',
      request: {
        id: 'perm-1',
        taskId: 'task-1',
        type: 'tool',
        toolName: 'shell',
        toolInput: { command: 'deploy' },
        createdAt: '2026-06-11T08:00:00.000Z',
      },
    });
  });

  it('maps denial responses to Pi block results with a reason', () => {
    const result = mapPermissionResponseToPiToolResult({
      requestId: 'perm-1',
      taskId: 'task-1',
      decision: 'deny',
      message: 'Needs maintainer approval',
    });

    expect(result).toEqual({ block: true, reason: 'Needs maintainer approval' });
  });

  it('auto-allows low-risk safe tools without creating a request', () => {
    const decision = createPiToolPermissionDecision({
      requestId: 'perm-2',
      taskId: 'task-1',
      toolName: 'read_file',
      toolInput: { path: 'README.md' },
      risk: 'low',
    });

    expect(decision).toEqual({ type: 'allow' });
  });
});
