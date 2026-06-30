/**
 * Login item registration and management
 * Feature: M3.4 Login Item Auto-Start
 */

import { randomUUID } from 'node:crypto';
import type {
  AutoStartPreference,
  EnableOptions,
  LoginItem,
  LoginItemStatus,
  RegistrationResult,
  UnregistrationResult,
} from '../types/login-item.js';
import { AutoStartMethod, LoginItemErrorCode, LoginItemState } from '../types/login-item.js';
import { RetryHandler } from './login-item-errors.js';
import { LoginItemLogger } from './login-item-logger.js';
import {
  handleDisableError,
  handleEnableError,
  performRegistration,
  updatePersistedState,
} from './login-item-manager-registration.js';
import { LoginItemPersistence } from './login-item-persistence.js';
import { LoginItemStateMachine } from './login-item-state.js';
import { buildStatusFromSystemQuery, querySystemLoginItem } from './login-item-system-query.js';
import { validatePath } from './login-item-validator.js';

/**
 * Login item manager for handling registration and management
 */
export class LoginItemManager {
  private stateMachine: LoginItemStateMachine;
  private logger: LoginItemLogger;
  private persistence: LoginItemPersistence;
  private retryHandler: RetryHandler;
  private loginItem: LoginItem | null = null;
  private autoStartPreference: AutoStartPreference | null = null;

  constructor() {
    this.stateMachine = new LoginItemStateMachine();
    this.logger = new LoginItemLogger();
    this.persistence = new LoginItemPersistence();
    this.retryHandler = new RetryHandler(1, 1000);
    this.loadPersistedState();
  }

  /**
   * Enable auto-start for the daemon
   */
  async enable(options: EnableOptions): Promise<RegistrationResult> {
    const startTime = Date.now();

    const pathValidation = validatePath(options.applicationPath);
    if (!pathValidation.valid) {
      return handleEnableError(
        options.label,
        options.method,
        pathValidation.error ?? 'Invalid path',
        LoginItemErrorCode.INVALID_PATH,
        this.logger,
      );
    }

    // D7: Check for path-based duplicate (same path, different label)
    if (this.loginItem && this.loginItem.applicationPath === options.applicationPath) {
      return handleEnableError(
        options.label,
        options.method,
        'Login item already registered for this path',
        LoginItemErrorCode.DUPLICATE_REGISTRATION,
        this.logger,
      );
    }

    // D8/D9: Handle reinstallation and path changes
    if (this.loginItem && this.loginItem.label === options.label) {
      if (this.loginItem.applicationPath !== options.applicationPath) {
        await this.updatePath(options.label, options.applicationPath);
        this.logger.logRegistration({
          label: options.label,
          method: options.method || AutoStartMethod.MyBoTeamDefaults,
          success: true,
          durationMs: Date.now() - startTime,
        });
        return {
          success: true,
          method: options.method || AutoStartMethod.MyBoTeamDefaults,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return performRegistration(
      options,
      startTime,
      this.stateMachine,
      this.persistence,
      this.logger,
      this.retryHandler,
    );
  }

  /**
   * Disable auto-start for the daemon
   */
  async disable(label: string): Promise<UnregistrationResult> {
    const startTime = Date.now();
    try {
      return await this.retryHandler.execute(async () => {
        this.stateMachine.transition(LoginItemState.Disabled);
        updatePersistedState(this.loginItem, this.autoStartPreference, false, this.persistence);
        this.logger.logUnregistration({ label, success: true, durationMs: Date.now() - startTime });
        return { success: true, timestamp: new Date().toISOString() };
      });
    } catch (error) {
      return handleDisableError(label, error, startTime, this.logger);
    }
  }

  /**
   * Get current status of a login item
   */
  async getStatus(label: string): Promise<LoginItemStatus> {
    this.logger.logStatusCheck({
      label,
      state: this.stateMachine.getCurrentState(),
      synced: true,
    });
    return {
      enabled: this.autoStartPreference?.enabled ?? false,
      state: this.stateMachine.getCurrentState(),
      method: this.autoStartPreference?.method || AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * D6: Sync with system state (query macOS for actual registration)
   */
  async syncWithSystem(label: string): Promise<LoginItemStatus> {
    const localEnabled = this.autoStartPreference?.enabled ?? false;
    const systemResult = await querySystemLoginItem(label);
    const status = buildStatusFromSystemQuery(systemResult, localEnabled);

    this.logger.logStatusCheck({ label, state: status.state, synced: true });

    if (systemResult.registered !== localEnabled) {
      this.autoStartPreference = {
        id: this.autoStartPreference?.id || randomUUID(),
        enabled: systemResult.registered,
        method: systemResult.method || AutoStartMethod.MyBoTeamDefaults,
        lastChecked: new Date().toISOString(),
        createdAt: this.autoStartPreference?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.persistence.saveAutoStartPreference(this.autoStartPreference);
    }

    return status;
  }
  getAutoStartPreference(): AutoStartPreference | null {
    return this.autoStartPreference;
  }
  getLoginItem(): LoginItem | null {
    return this.loginItem;
  }
  getLogs() {
    return this.logger.getLogs();
  }

  detectReinstallation(label: string, currentPath: string): boolean {
    if (!this.loginItem || this.loginItem.label !== label) return false;
    return this.loginItem.applicationPath !== currentPath;
  }

  async updatePath(label: string, newPath: string): Promise<boolean> {
    if (!this.loginItem || this.loginItem.label !== label) return false;
    const pathValidation = validatePath(newPath);
    if (!pathValidation.valid) return false;
    this.loginItem.applicationPath = newPath;
    this.loginItem.lastUpdated = new Date().toISOString();
    this.persistence.saveLoginItem(this.loginItem);
    this.logger.logStateTransition({
      label,
      previousState: this.stateMachine.getCurrentState(),
      newState: this.stateMachine.getCurrentState(),
    });
    return true;
  }

  private loadPersistedState(): void {
    this.loginItem = this.persistence.getLoginItem();
    this.autoStartPreference = this.persistence.getAutoStartPreference();
    if (this.loginItem) {
      this.stateMachine = new LoginItemStateMachine(this.loginItem.state);
    }
  }
}
