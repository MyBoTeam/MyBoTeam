/**
 * UserDefaults/AppStorage persistence for auto-start preference
 * Feature: M3.4 Login Item Auto-Start
 */

import type { AutoStartPreference, LoginItem } from '../types/login-item.js';

/**
 * Storage keys for UserDefaults/AppStorage
 */
const STORAGE_KEYS = {
  AUTO_START_PREFERENCE: 'mybot_auto_start_preference',
  LOGIN_ITEM: 'mybot_login_item',
} as const;

/**
 * Persistence manager for auto-start preferences and login item state
 */
export class LoginItemPersistence {
  private static storage: Map<string, string> = new Map();

  /**
   * Get auto-start preference from storage
   */
  getAutoStartPreference(): AutoStartPreference | null {
    const data = LoginItemPersistence.storage.get(STORAGE_KEYS.AUTO_START_PREFERENCE);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as AutoStartPreference;
    } catch {
      return null;
    }
  }

  /**
   * Save auto-start preference to storage
   */
  saveAutoStartPreference(preference: AutoStartPreference): void {
    LoginItemPersistence.storage.set(
      STORAGE_KEYS.AUTO_START_PREFERENCE,
      JSON.stringify(preference),
    );
  }

  /**
   * Get login item from storage
   */
  getLoginItem(): LoginItem | null {
    const data = LoginItemPersistence.storage.get(STORAGE_KEYS.LOGIN_ITEM);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as LoginItem;
    } catch {
      return null;
    }
  }

  /**
   * Save login item to storage
   */
  saveLoginItem(item: LoginItem): void {
    LoginItemPersistence.storage.set(STORAGE_KEYS.LOGIN_ITEM, JSON.stringify(item));
  }

  /**
   * Remove login item from storage
   */
  removeLoginItem(): void {
    LoginItemPersistence.storage.delete(STORAGE_KEYS.LOGIN_ITEM);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    LoginItemPersistence.storage.clear();
  }
}
