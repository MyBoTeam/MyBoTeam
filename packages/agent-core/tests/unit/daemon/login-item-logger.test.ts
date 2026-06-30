/**
 * Tests for login item logger
 * Feature: M3.4 Login Item Auto-Start
 */

import { describe, expect, it } from 'vitest';
import { LoginItemEvent, LoginItemLogger } from '../../src/daemon/login-item-logger.js';
import { AutoStartMethod, LoginItemState } from '../../src/types/login-item.js';

describe('LoginItemLogger', () => {
  it('logs registration event', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logRegistration({
      label: 'com.test.daemon',
      method: AutoStartMethod.MyBoTeamDefaults,
      success: true,
      durationMs: 150,
    });
    expect(entry.event).toBe(LoginItemEvent.REGISTER);
    expect(entry.label).toBe('com.test.daemon');
    expect(entry.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    expect(entry.durationMs).toBe(150);
  });

  it('logs failed registration as error', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logRegistration({
      label: 'com.test.daemon',
      method: AutoStartMethod.MyBoTeamDefaults,
      success: false,
      errorCode: 'REGISTRATION_FAILED',
      errorMessage: 'Permission denied',
    });
    expect(entry.event).toBe(LoginItemEvent.ERROR);
    expect(entry.errorCode).toBe('REGISTRATION_FAILED');
  });

  it('logs unregistration event', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logUnregistration({
      label: 'com.test.daemon',
      success: true,
      durationMs: 50,
    });
    expect(entry.event).toBe(LoginItemEvent.UNREGISTER);
    expect(entry.label).toBe('com.test.daemon');
  });

  it('logs status check event', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logStatusCheck({
      label: 'com.test.daemon',
      state: LoginItemState.Enabled,
      synced: true,
    });
    expect(entry.event).toBe(LoginItemEvent.STATUS_CHECK);
    expect(entry.newState).toBe(LoginItemState.Enabled);
    expect(entry.metadata).toEqual({ synced: true });
  });

  it('logs state transition event', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logStateTransition({
      label: 'com.test.daemon',
      previousState: LoginItemState.Disabled,
      newState: LoginItemState.Enabled,
    });
    expect(entry.event).toBe(LoginItemEvent.STATE_TRANSITION);
    expect(entry.previousState).toBe(LoginItemState.Disabled);
    expect(entry.newState).toBe(LoginItemState.Enabled);
  });

  it('logs error event', () => {
    const logger = new LoginItemLogger();
    const entry = logger.logError({
      label: 'com.test.daemon',
      errorCode: 'SYSTEM_ERROR',
      errorMessage: 'Something went wrong',
      durationMs: 200,
    });
    expect(entry.event).toBe(LoginItemEvent.ERROR);
    expect(entry.errorCode).toBe('SYSTEM_ERROR');
    expect(entry.durationMs).toBe(200);
  });

  it('returns all logs', () => {
    const logger = new LoginItemLogger();
    logger.logRegistration({ label: 'a', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    logger.logRegistration({ label: 'b', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    expect(logger.getLogs()).toHaveLength(2);
  });

  it('filters logs by label', () => {
    const logger = new LoginItemLogger();
    logger.logRegistration({ label: 'a', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    logger.logRegistration({ label: 'b', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    expect(logger.getLogsByLabel('a')).toHaveLength(1);
    expect(logger.getLogsByLabel('b')).toHaveLength(1);
  });

  it('filters logs by event type', () => {
    const logger = new LoginItemLogger();
    logger.logRegistration({ label: 'a', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    logger.logUnregistration({ label: 'a', success: true });
    expect(logger.getLogsByEvent(LoginItemEvent.REGISTER)).toHaveLength(1);
    expect(logger.getLogsByEvent(LoginItemEvent.UNREGISTER)).toHaveLength(1);
  });

  it('clears all logs', () => {
    const logger = new LoginItemLogger();
    logger.logRegistration({ label: 'a', method: AutoStartMethod.MyBoTeamDefaults, success: true });
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
