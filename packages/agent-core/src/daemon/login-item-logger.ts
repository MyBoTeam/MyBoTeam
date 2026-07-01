/**
 * Logger for login item events
 * Feature: M3.4 Login Item Auto-Start
 */

import type { AutoStartMethod, LoginItemState } from '../types/login-item.js';
import { LoginItemEvent, type LoginItemLogEntry } from './login-item-log-types.js';

export { LoginItemEvent, type LoginItemLogEntry } from './login-item-log-types.js';

/**
 * Logger for login item events
 */
export class LoginItemLogger {
  private logs: LoginItemLogEntry[] = [];
  private enableConsoleLogging: boolean;

  constructor(enableConsoleLogging: boolean = false) {
    this.enableConsoleLogging = enableConsoleLogging;
  }

  /**
   * Log a registration event
   */
  logRegistration(params: {
    label: string;
    method: AutoStartMethod;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    durationMs?: number;
  }): LoginItemLogEntry {
    const entry: LoginItemLogEntry = {
      event: params.success ? LoginItemEvent.REGISTER : LoginItemEvent.ERROR,
      timestamp: new Date().toISOString(),
      label: params.label,
      method: params.method,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      durationMs: params.durationMs,
    };

    this.addLog(entry);
    return entry;
  }

  /**
   * Log an unregistration event
   */
  logUnregistration(params: {
    label: string;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    durationMs?: number;
  }): LoginItemLogEntry {
    const entry: LoginItemLogEntry = {
      event: params.success ? LoginItemEvent.UNREGISTER : LoginItemEvent.ERROR,
      timestamp: new Date().toISOString(),
      label: params.label,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      durationMs: params.durationMs,
    };

    this.addLog(entry);
    return entry;
  }

  /**
   * Log a status check event
   */
  logStatusCheck(params: {
    label: string;
    state: LoginItemState;
    synced: boolean;
  }): LoginItemLogEntry {
    const entry: LoginItemLogEntry = {
      event: LoginItemEvent.STATUS_CHECK,
      timestamp: new Date().toISOString(),
      label: params.label,
      newState: params.state,
      metadata: { synced: params.synced },
    };

    this.addLog(entry);
    return entry;
  }

  /**
   * Log a state transition event
   */
  logStateTransition(params: {
    label: string;
    previousState: LoginItemState;
    newState: LoginItemState;
  }): LoginItemLogEntry {
    const entry: LoginItemLogEntry = {
      event: LoginItemEvent.STATE_TRANSITION,
      timestamp: new Date().toISOString(),
      label: params.label,
      previousState: params.previousState,
      newState: params.newState,
    };

    this.addLog(entry);
    return entry;
  }

  /**
   * Log an error event
   */
  logError(params: {
    label: string;
    errorCode: string;
    errorMessage: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  }): LoginItemLogEntry {
    const entry: LoginItemLogEntry = {
      event: LoginItemEvent.ERROR,
      timestamp: new Date().toISOString(),
      label: params.label,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      durationMs: params.durationMs,
      metadata: params.metadata,
    };

    this.addLog(entry);
    return entry;
  }

  /**
   * Get all logs
   */
  getLogs(): LoginItemLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific label
   */
  getLogsByLabel(label: string): LoginItemLogEntry[] {
    return this.logs.filter((log) => log.label === label);
  }

  /**
   * Get logs for a specific event type
   */
  getLogsByEvent(event: LoginItemEvent): LoginItemLogEntry[] {
    return this.logs.filter((log) => log.event === event);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Add a log entry
   */
  private addLog(entry: LoginItemLogEntry): void {
    this.logs.push(entry);

    if (this.enableConsoleLogging) {
    }
  }
}
