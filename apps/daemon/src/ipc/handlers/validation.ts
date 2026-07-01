import { JSON_RPC_ERRORS } from '@myboteam/agent-core/ipc/types.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: number = JSON_RPC_ERRORS.INVALID_PARAMS,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: unknown, name: string): void {
  if (value === undefined || value === null) {
    throw new ValidationError(`Missing required param: ${name}`);
  }
}

export function validateString(value: unknown, name: string): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${name} must be a string`);
  }
}

export function validateNumber(value: unknown, name: string, options?: { min?: number; max?: number }): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${name} must be a finite number`);
  }
  if (options?.min !== undefined && value < options.min) {
    throw new ValidationError(`${name} must be at least ${options.min}`);
  }
  if (options?.max !== undefined && value > options.max) {
    throw new ValidationError(`${name} must be at most ${options.max}`);
  }
}

export function validateObject(value: unknown, name: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
