import { PERMISSION_REQUEST_TIMEOUT_MS } from '../../common/index.js';
import type { PendingRequest } from './permission-request-state.js';
import {
  buildFilePermissionRequest,
  buildQuestionRequest,
  createPendingPermissionRequest,
  createPendingQuestionRequest,
  validateFilePermissionRequest,
  validateQuestionRequest,
} from './permission-request-state.js';

export type {
  FilePermissionRequestData,
  PendingRequest,
  PermissionValidationResult,
  QuestionRequestData,
  QuestionResponseData,
} from './permission-request-state.js';

export {
  validateFilePermissionRequest,
  validateQuestionRequest,
} from './permission-request-state.js';

export class PermissionRequestHandler {
  private pendingPermissions = new Map<string, PendingRequest<boolean>>();
  private pendingQuestions = new Map<
    string,
    PendingRequest<{ selectedOptions?: string[]; customText?: string; denied?: boolean }>
  >();
  private defaultTimeoutMs: number;

  constructor(timeoutMs: number = PERMISSION_REQUEST_TIMEOUT_MS) {
    this.defaultTimeoutMs = timeoutMs;
  }

  createPermissionRequest(timeoutMs?: number): { requestId: string; promise: Promise<boolean> } {
    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const { requestId, pending, promise } = createPendingPermissionRequest(timeout, (id) => {
      this.pendingPermissions.delete(id);
    });
    this.pendingPermissions.set(requestId, pending);
    return { requestId, promise };
  }

  createQuestionRequest(timeoutMs?: number): {
    requestId: string;
    promise: Promise<{ selectedOptions?: string[]; customText?: string; denied?: boolean }>;
  } {
    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const { requestId, pending, promise } = createPendingQuestionRequest(timeout, (id) => {
      this.pendingQuestions.delete(id);
    });
    this.pendingQuestions.set(requestId, pending);
    return { requestId, promise };
  }

  resolvePermissionRequest(requestId: string, allowed: boolean): boolean {
    const pending = this.pendingPermissions.get(requestId);
    if (!pending) {
      return false;
    }
    clearTimeout(pending.timeoutId);
    pending.resolve(allowed);
    this.pendingPermissions.delete(requestId);
    return true;
  }

  resolveQuestionRequest(
    requestId: string,
    response: { selectedOptions?: string[]; customText?: string; denied?: boolean },
  ): boolean {
    const pending = this.pendingQuestions.get(requestId);
    if (!pending) {
      return false;
    }
    clearTimeout(pending.timeoutId);
    pending.resolve(response);
    this.pendingQuestions.delete(requestId);
    return true;
  }

  validateFilePermissionRequest = validateFilePermissionRequest;

  validateQuestionRequest = validateQuestionRequest;

  buildFilePermissionRequest = buildFilePermissionRequest;

  buildQuestionRequest = buildQuestionRequest;

  hasPendingPermissions(): boolean {
    return this.pendingPermissions.size > 0;
  }

  hasPendingQuestions(): boolean {
    return this.pendingQuestions.size > 0;
  }

  getPendingPermissionCount(): number {
    return this.pendingPermissions.size;
  }

  getPendingQuestionCount(): number {
    return this.pendingQuestions.size;
  }

  clearAll(): void {
    for (const [_requestId, pending] of this.pendingPermissions) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Request cancelled'));
    }
    this.pendingPermissions.clear();

    for (const [_requestId, pending] of this.pendingQuestions) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Request cancelled'));
    }
    this.pendingQuestions.clear();
  }
}
