/**
 * Registration helper functions for login item manager
 * Feature: M3.4 Login Item Auto-Start
 */

import { randomUUID } from 'node:crypto';
import type {
  AutoStartPreference,
  EnableOptions,
  LoginItem,
  RegistrationResult,
  UnregistrationResult,
} from '../types/login-item.js';
import { AutoStartMethod, LoginItemErrorCode, LoginItemState } from '../types/login-item.js';
import { createLoginItemError, LoginItemError, type RetryHandler } from './login-item-errors.js';
import type { LoginItemLogger } from './login-item-logger.js';
import type { LoginItemPersistence } from './login-item-persistence.js';
import type { LoginItemStateMachine } from './login-item-state.js';
import { LoginItemRegistration } from './login-item-registration.js';
import { LoginItemServiceMgmt } from './login-item-service-mgmt.js';

/**
 * Handle enable errors (path validation, duplicates)
 */
export function handleEnableError(
  label: string,
  method: AutoStartMethod | undefined,
  message: string,
  code: LoginItemErrorCode,
  startTime: number,
  logger: LoginItemLogger,
): RegistrationResult {
  const error = new LoginItemError(message, code);
  logger.logError({ label, errorCode: error.code, errorMessage: error.message });
  return {
    success: false,
    method: method || AutoStartMethod.MyBoTeamDefaults,
    errorCode: error.code,
    errorMessage: error.message,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Perform the actual registration with retry logic
 */
export async function performRegistration(
  options: EnableOptions,
  startTime: number,
  stateMachine: LoginItemStateMachine,
  persistence: LoginItemPersistence,
  logger: LoginItemLogger,
  retryHandler: RetryHandler,
): Promise<RegistrationResult> {
  try {
    return await retryHandler.execute(async () => {
      // Invoke the real registration path based on method
      const method = options.method || AutoStartMethod.MyBoTeamDefaults;
      let registrationResult: RegistrationResult;

      if (method === AutoStartMethod.ServiceManagement) {
        const serviceMgmt = new LoginItemServiceMgmt();
        registrationResult = await serviceMgmt.register(options);
      } else {
        const registration = new LoginItemRegistration();
        registrationResult = await registration.register(options);
      }

      // Only persist and update state if registration succeeded
      if (!registrationResult.success) {
        return registrationResult;
      }

      const loginItem: LoginItem = {
        id: randomUUID(),
        applicationPath: options.applicationPath,
        label: options.label,
        state: LoginItemState.Enabled,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const autoStartPreference: AutoStartPreference = {
        id: randomUUID(),
        enabled: true,
        method,
        lastChecked: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistence.saveLoginItem(loginItem);
      persistence.saveAutoStartPreference(autoStartPreference);
      
      // Transition state only after persistence succeeds
      stateMachine.transition(LoginItemState.Enabled);
      
      logger.logRegistration({
        label: options.label,
        method,
        success: true,
        durationMs: Date.now() - startTime,
      });
      return {
        success: true,
        method,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const loginItemError = new LoginItemError(message, LoginItemErrorCode.REGISTRATION_FAILED, {
      originalError: error,
    });
    logger.logError({
      label: options.label,
      errorCode: loginItemError.code,
      errorMessage: loginItemError.message,
      durationMs: Date.now() - startTime,
    });
    return {
      success: false,
      method: options.method || AutoStartMethod.MyBoTeamDefaults,
      errorCode: loginItemError.code,
      errorMessage: loginItemError.message,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Update persisted state after disable
 */
export function updatePersistedState(
  loginItem: LoginItem | null,
  autoStartPreference: AutoStartPreference | null,
  enabled: boolean,
  persistence: LoginItemPersistence,
): void {
  if (loginItem) {
    loginItem.state = enabled ? LoginItemState.Enabled : LoginItemState.Disabled;
    loginItem.lastUpdated = new Date().toISOString();
    persistence.saveLoginItem(loginItem);
  }
  if (autoStartPreference) {
    autoStartPreference.enabled = enabled;
    autoStartPreference.updatedAt = new Date().toISOString();
    persistence.saveAutoStartPreference(autoStartPreference);
  }
}

/**
 * Handle disable errors
 */
export function handleDisableError(
  label: string,
  error: unknown,
  startTime: number,
  logger: LoginItemLogger,
): UnregistrationResult {
  const loginItemError = createLoginItemError(error, LoginItemErrorCode.UNREGISTRATION_FAILED);
  logger.logError({
    label,
    errorCode: loginItemError.code,
    errorMessage: loginItemError.message,
    durationMs: Date.now() - startTime,
  });
  return {
    success: false,
    errorCode: loginItemError.code,
    errorMessage: loginItemError.message,
    timestamp: new Date().toISOString(),
  };
}
