/**
 * Error codes and handling utilities for login item operations
 * Feature: M3.4 Login Item Auto-Start
 */

import { LoginItemErrorCode } from '../types/login-item.js';

export { LoginItemErrorCode };

/**
 * Custom error class for login item operations
 */
export class LoginItemError extends Error {
  public readonly code: LoginItemErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: LoginItemErrorCode, details?: Record<string, unknown>) {
    super(message);
    this.name = 'LoginItemError';
    this.code = code;
    this.details = details;
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    switch (this.code) {
      case LoginItemErrorCode.REGISTRATION_FAILED:
        return 'Failed to register login item. Please try again or set up manually in System Preferences.';
      case LoginItemErrorCode.UNREGISTRATION_FAILED:
        return 'Failed to remove login item. Please try again or remove manually in System Preferences.';
      case LoginItemErrorCode.PERMISSION_DENIED:
        return 'Permission denied. Please grant login item permissions in System Preferences.';
      case LoginItemErrorCode.INVALID_PATH:
        return 'Invalid application path. Please reinstall the application.';
      case LoginItemErrorCode.DUPLICATE_REGISTRATION:
        return 'Login item already registered.';
      case LoginItemErrorCode.SYSTEM_ERROR:
        return 'A system error occurred. Please try again later.';
      case LoginItemErrorCode.TIMEOUT:
        return 'Operation timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get manual setup instructions
   */
  getManualSetupInstructions(): string {
    return `To manually set up auto-start:
1. Open System Preferences > Users & Groups
2. Click on your user account
3. Select the "Login Items" tab
4. Click the "+" button
5. Navigate to and select the daemon application
6. Click "Add"

The daemon will now start automatically when you log in.`;
  }
}

/**
 * Create a LoginItemError from an unknown error
 */
export function createLoginItemError(error: unknown, code: LoginItemErrorCode): LoginItemError {
  if (error instanceof LoginItemError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new LoginItemError(message, code, { originalError: error });
}

/**
 * Retry handler for login item operations
 * FR-011: Retry once on failure, then show user-friendly error message.
 * maxRetries=1 means: initial attempt + 1 retry = 2 total attempts.
 */
export class RetryHandler {
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(maxRetries: number = 1, retryDelayMs: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    errorHandler?: (error: unknown) => LoginItemError,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * (attempt + 1));
        }
      }
    }

    throw errorHandler
      ? errorHandler(lastError)
      : createLoginItemError(lastError, LoginItemErrorCode.SYSTEM_ERROR);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
