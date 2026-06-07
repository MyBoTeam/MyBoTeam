import { PERMISSION_REQUEST_TIMEOUT_MS } from '../common/index.js';
import type { PermissionRequest } from '../common/types/permission.js';
import {
  buildFilePermissionRequest,
  buildQuestionRequest,
  createFilePermissionRequestId,
  createQuestionRequestId,
  type FilePermissionRequestData,
  type PendingRequest,
  type PermissionValidationResult,
  type QuestionRequestData,
  type QuestionResponseData,
  validateFilePermissionRequest,
  validateQuestionRequest,
} from './permission-handler-utils.js';

export type {
  FilePermissionRequestData,
  PendingRequest,
  PermissionValidationResult,
  QuestionRequestData,
  QuestionResponseData,
} from './permission-handler-utils.js';

export class PermissionRequestHandler {
  private pendingPermissions = new Map<string, PendingRequest<boolean>>();
  private pendingQuestions = new Map<string, PendingRequest<QuestionResponseData>>();
  private defaultTimeoutMs: number;

  constructor(timeoutMs: number = PERMISSION_REQUEST_TIMEOUT_MS) {
    this.defaultTimeoutMs = timeoutMs;
  }

  createPermissionRequest(timeoutMs?: number): { requestId: string; promise: Promise<boolean> } {
    const requestId = createFilePermissionRequestId();
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    const promise = new Promise<boolean>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingPermissions.delete(requestId);
        reject(new Error('Permission request timed out'));
      }, timeout);

      this.pendingPermissions.set(requestId, { resolve, reject, timeoutId });
    });

    return { requestId, promise };
  }

  createQuestionRequest(timeoutMs?: number): {
    requestId: string;
    promise: Promise<QuestionResponseData>;
  } {
    const requestId = createQuestionRequestId();
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    const promise = new Promise<QuestionResponseData>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingQuestions.delete(requestId);
        reject(new Error('Question request timed out'));
      }, timeout);

      this.pendingQuestions.set(requestId, { resolve, reject, timeoutId });
    });

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

  resolveQuestionRequest(requestId: string, response: QuestionResponseData): boolean {
    const pending = this.pendingQuestions.get(requestId);
    if (!pending) {
      return false;
    }

    clearTimeout(pending.timeoutId);
    pending.resolve(response);
    this.pendingQuestions.delete(requestId);
    return true;
  }

  validateFilePermissionRequest(data: unknown): PermissionValidationResult {
    return validateFilePermissionRequest(data);
  }

  validateQuestionRequest(data: unknown): PermissionValidationResult {
    return validateQuestionRequest(data);
  }

  buildFilePermissionRequest(
    requestId: string,
    taskId: string,
    data: FilePermissionRequestData,
  ): PermissionRequest {
    return buildFilePermissionRequest(requestId, taskId, data);
  }

  buildQuestionRequest(
    requestId: string,
    taskId: string,
    data: QuestionRequestData,
  ): PermissionRequest {
    return buildQuestionRequest(requestId, taskId, data);
  }

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
