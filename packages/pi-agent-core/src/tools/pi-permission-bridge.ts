import type { PermissionRequest, PermissionResponse } from '../adapter/task-runtime-types.js';

export interface PiToolPermissionInput {
  requestId: string;
  taskId: string;
  toolName: string;
  toolInput: unknown;
  risk: 'low' | 'high';
  createdAt?: string;
}

export type PiToolPermissionDecision =
  | { type: 'allow' }
  | { type: 'request'; request: PermissionRequest };

export interface PiToolCallPermissionResult {
  block?: true;
  reason?: string;
}

export function createPiToolPermissionDecision(
  input: PiToolPermissionInput,
): PiToolPermissionDecision {
  if (input.risk === 'low') {
    return { type: 'allow' };
  }

  return {
    type: 'request',
    request: {
      id: input.requestId,
      taskId: input.taskId,
      type: 'tool',
      toolName: input.toolName,
      toolInput: input.toolInput,
      createdAt: input.createdAt ?? new Date().toISOString(),
    },
  };
}

export function mapPermissionResponseToPiToolResult(
  response: PermissionResponse,
): PiToolCallPermissionResult {
  if (response.decision === 'allow') {
    return {};
  }

  return {
    block: true,
    reason: response.message ?? 'Permission denied',
  };
}
