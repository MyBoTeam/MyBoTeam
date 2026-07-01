/**
 * Input validation for login item operations
 * Feature: M3.4 Login Item Auto-Start
 */

import { statSync } from 'node:fs';
import { LoginItemErrorCode } from '../types/login-item.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Validate application path
 */
export function validatePath(path: string): ValidationResult {
  if (!path || path.trim().length === 0) {
    return {
      valid: false,
      error: 'Application path cannot be empty',
      errorCode: LoginItemErrorCode.INVALID_PATH,
    };
  }

  // Check for relative paths
  if (!path.startsWith('/')) {
    return {
      valid: false,
      error: 'Application path must be an absolute path',
      errorCode: LoginItemErrorCode.INVALID_PATH,
    };
  }

  // Check for common invalid characters
  const invalidChars = /[<>"|?*]/;
  if (invalidChars.test(path)) {
    return {
      valid: false,
      error: 'Application path contains invalid characters',
      errorCode: LoginItemErrorCode.INVALID_PATH,
    };
  }

  // Check if path exists and is a file
  try {
    const stat = statSync(path);
    if (!stat.isFile()) {
      return {
        valid: false,
        error: 'Application path must point to a file',
        errorCode: LoginItemErrorCode.INVALID_PATH,
      };
    }
  } catch {
    return {
      valid: false,
      error: 'Application path does not exist',
      errorCode: LoginItemErrorCode.INVALID_PATH,
    };
  }

  return { valid: true };
}

/**
 * Validate login item label
 */
export function validateLabel(label: string): ValidationResult {
  if (!label || label.trim().length === 0) {
    return {
      valid: false,
      error: 'Login item label cannot be empty',
      errorCode: LoginItemErrorCode.INVALID_LABEL,
    };
  }

  // Check for valid label format (reverse domain notation recommended)
  const labelRegex = /^[a-zA-Z0-9._-]+$/;
  if (!labelRegex.test(label)) {
    return {
      valid: false,
      error:
        'Login item label must contain only alphanumeric characters, dots, hyphens, and underscores',
      errorCode: LoginItemErrorCode.INVALID_LABEL,
    };
  }

  return { valid: true };
}

/**
 * Validate enable options
 */
export function validateEnableOptions(options: {
  applicationPath: string;
  label: string;
}): ValidationResult {
  const pathValidation = validatePath(options.applicationPath);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  const labelValidation = validateLabel(options.label);
  if (!labelValidation.valid) {
    return labelValidation;
  }

  return { valid: true };
}
