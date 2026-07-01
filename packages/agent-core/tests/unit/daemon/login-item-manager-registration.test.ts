/**
 * Tests for login item manager registration helper functions
 * Feature: M3.4 Login Item Auto-Start
 */

import { describe, expect, it, vi } from 'vitest';
import { RetryHandler } from '../../../src/daemon/login-item-errors.js';
import type { LoginItemLogger } from '../../../src/daemon/login-item-logger.js';
import {
  handleDisableError,
  handleEnableError,
  performRegistration,
  updatePersistedState,
} from '../../../src/daemon/login-item-manager-registration.js';
import type { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';
import { LoginItemStateMachine } from '../../../src/daemon/login-item-state.js';
import type {
  AutoStartPreference,
  EnableOptions,
  LoginItem,
} from '../../../src/types/login-item.js';
import {
  AutoStartMethod,
  LoginItemErrorCode,
  LoginItemState,
} from '../../../src/types/login-item.js';

function createMockLogger() {
  return {
    logError: vi.fn(),
    logRegistration: vi.fn(),
    logUnregistration: vi.fn(),
    logStatusCheck: vi.fn(),
    logStateTransition: vi.fn(),
    getLogs: vi.fn().mockReturnValue([]),
  } as unknown as LoginItemLogger;
}

function createMockPersistence() {
  return {
    saveLoginItem: vi.fn(),
    saveAutoStartPreference: vi.fn(),
    getLoginItem: vi.fn().mockReturnValue(null),
    getAutoStartPreference: vi.fn().mockReturnValue(null),
  } as unknown as LoginItemPersistence;
}

describe('handleEnableError', () => {
  it('returns failure result with error details', () => {
    const logger = createMockLogger();
    const result = handleEnableError(
      'test-label',
      AutoStartMethod.MyBoTeamDefaults,
      'Invalid path',
      LoginItemErrorCode.INVALID_PATH,
      Date.now(),
      logger,
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(LoginItemErrorCode.INVALID_PATH);
    expect(result.errorMessage).toBe('Invalid path');
    expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    expect(result.durationMs).toBeDefined();
    expect(logger.logError).toHaveBeenCalled();
  });

  it('defaults to MyBoTeamDefaults when method is undefined', () => {
    const logger = createMockLogger();
    const result = handleEnableError(
      'test-label',
      undefined,
      'Duplicate',
      LoginItemErrorCode.DUPLICATE_REGISTRATION,
      Date.now(),
      logger,
    );
    expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
  });
});

describe('handleDisableError', () => {
  it('returns failure result with error details', () => {
    const logger = createMockLogger();
    const startTime = Date.now() - 100;
    const result = handleDisableError('test-label', new Error('System error'), startTime, logger);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(LoginItemErrorCode.UNREGISTRATION_FAILED);
    expect(logger.logError).toHaveBeenCalled();
  });
});

describe('performRegistration', () => {
  it('creates login item and preference on success', async () => {
    const logger = createMockLogger();
    const persistence = createMockPersistence();
    const stateMachine = new LoginItemStateMachine();
    const retryHandler = new RetryHandler(1, 100);
    const options: EnableOptions = {
      applicationPath: '/usr/local/bin/daemon',
      label: 'com.test.daemon',
    };

    const result = await performRegistration(
      options,
      Date.now(),
      stateMachine,
      persistence,
      logger,
      retryHandler,
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    expect(persistence.saveLoginItem).toHaveBeenCalled();
    expect(persistence.saveAutoStartPreference).toHaveBeenCalled();
    expect(logger.logRegistration).toHaveBeenCalled();
    expect(stateMachine.getCurrentState()).toBe(LoginItemState.Enabled);
  });

  it('returns error result when registration fails', async () => {
    const logger = createMockLogger();
    const persistence = createMockPersistence();
    const stateMachine = new LoginItemStateMachine();
    const retryHandler = new RetryHandler(1, 100);

    vi.mocked(persistence.saveLoginItem).mockImplementation(() => {
      throw new Error('Storage full');
    });

    const options: EnableOptions = {
      applicationPath: '/usr/local/bin/daemon',
      label: 'com.test.daemon',
    };

    const result = await performRegistration(
      options,
      Date.now(),
      stateMachine,
      persistence,
      logger,
      retryHandler,
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(LoginItemErrorCode.REGISTRATION_FAILED);
    expect(logger.logError).toHaveBeenCalled();
    // State machine should remain disabled after failed registration
    expect(stateMachine.getCurrentState()).toBe(LoginItemState.Disabled);
  });
});

describe('updatePersistedState', () => {
  it('updates login item and preference when enabled', () => {
    const persistence = createMockPersistence();
    const loginItem: LoginItem = {
      id: '1',
      applicationPath: '/usr/local/bin/daemon',
      label: 'com.test.daemon',
      state: LoginItemState.Disabled,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const preference: AutoStartPreference = {
      id: '1',
      enabled: false,
      method: AutoStartMethod.MyBoTeamDefaults,
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updatePersistedState(loginItem, preference, true, persistence);

    expect(loginItem.state).toBe(LoginItemState.Enabled);
    expect(preference.enabled).toBe(true);
    expect(persistence.saveLoginItem).toHaveBeenCalledWith(loginItem);
    expect(persistence.saveAutoStartPreference).toHaveBeenCalledWith(preference);
  });

  it('skips null login item', () => {
    const persistence = createMockPersistence();
    const preference: AutoStartPreference = {
      id: '1',
      enabled: false,
      method: AutoStartMethod.MyBoTeamDefaults,
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updatePersistedState(null, preference, true, persistence);

    expect(preference.enabled).toBe(true);
    expect(persistence.saveLoginItem).not.toHaveBeenCalled();
    expect(persistence.saveAutoStartPreference).toHaveBeenCalled();
  });

  it('skips null preference', () => {
    const persistence = createMockPersistence();
    const loginItem: LoginItem = {
      id: '1',
      applicationPath: '/usr/local/bin/daemon',
      label: 'com.test.daemon',
      state: LoginItemState.Disabled,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    updatePersistedState(loginItem, null, true, persistence);

    expect(loginItem.state).toBe(LoginItemState.Enabled);
    expect(persistence.saveLoginItem).toHaveBeenCalled();
    expect(persistence.saveAutoStartPreference).not.toHaveBeenCalled();
  });
});
