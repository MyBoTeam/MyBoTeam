/**
 * Service layer for auto-start functionality
 * Feature: M3.4 Login Item Auto-Start
 *
 * Architectural justification: This thin wrapper exists to provide a stable
 * service-layer API for UI components and external consumers, decoupling them
 * from the LoginItemManager internals. It enables future cross-cutting concerns
 * (caching, validation, instrumentation) without modifying the manager.
 */

import { LoginItemManager } from '../daemon/login-item-manager.js';
import type {
  EnableOptions,
  LoginItemStatus,
  RegistrationResult,
  UnregistrationResult,
} from '../types/login-item.js';

/**
 * Service layer for auto-start functionality
 */
export class AutoStartService {
  private manager: LoginItemManager;

  constructor() {
    this.manager = new LoginItemManager();
  }

  /**
   * Enable auto-start for the daemon
   */
  async enable(options: EnableOptions): Promise<RegistrationResult> {
    return this.manager.enable(options);
  }

  /**
   * Disable auto-start for the daemon
   */
  async disable(label: string): Promise<UnregistrationResult> {
    return this.manager.disable(label);
  }

  /**
   * Get current status of a login item
   */
  async getStatus(label: string): Promise<LoginItemStatus> {
    return this.manager.getStatus(label);
  }

  /**
   * Sync with system state (query macOS for actual registration)
   */
  async syncWithSystem(label: string): Promise<LoginItemStatus> {
    return this.manager.syncWithSystem(label);
  }

  /**
   * Get auto-start preference
   */
  getAutoStartPreference() {
    return this.manager.getAutoStartPreference();
  }

  /**
   * Get login item
   */
  getLoginItem() {
    return this.manager.getLoginItem();
  }

  /**
   * Get logs
   */
  getLogs() {
    return this.manager.getLogs();
  }
}
