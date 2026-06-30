/**
 * Registration handler for login items
 * Feature: M3.4 Login Item Auto-Start
 */

import type {
  EnableOptions,
  RegistrationResult,
  UnregistrationResult,
} from '../types/login-item.js';
import { AutoStartMethod, LoginItemErrorCode } from '../types/login-item.js';
import { createLoginItemError } from './login-item-errors.js';

/**
 * Registration handler implementation
 */
export class LoginItemRegistration {
  private registrations: Map<string, { path: string; timestamp: string }> = new Map();

  /**
   * Register a login item
   */
  async register(options: EnableOptions): Promise<RegistrationResult> {
    try {
      // Validate path
      if (!options.applicationPath) {
        return {
          success: false,
          method: AutoStartMethod.MyBoTeamDefaults,
          errorCode: LoginItemErrorCode.INVALID_PATH,
          errorMessage: 'Application path cannot be empty',
          timestamp: new Date().toISOString(),
        };
      }

      // Store registration
      this.registrations.set(options.label, {
        path: options.applicationPath,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        method: AutoStartMethod.MyBoTeamDefaults,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const loginItemError = createLoginItemError(error, LoginItemErrorCode.REGISTRATION_FAILED);

      return {
        success: false,
        method: AutoStartMethod.MyBoTeamDefaults,
        errorCode: loginItemError.code,
        errorMessage: loginItemError.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Unregister a login item
   */
  async unregister(label: string): Promise<UnregistrationResult> {
    try {
      this.registrations.delete(label);

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const loginItemError = createLoginItemError(error, LoginItemErrorCode.UNREGISTRATION_FAILED);

      return {
        success: false,
        errorCode: loginItemError.code,
        errorMessage: loginItemError.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if a login item is registered
   */
  async isRegistered(label: string): Promise<boolean> {
    return this.registrations.has(label);
  }

  /**
   * Get all registrations
   */
  getRegistrations(): Map<string, { path: string; timestamp: string }> {
    return new Map(this.registrations);
  }
}
