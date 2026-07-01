/**
 * Types and enums for login item logging
 * Feature: M3.4 Login Item Auto-Start
 */

import type { AutoStartMethod, LoginItemState } from '../types/login-item.js';

/**
 * Log entry for login item events
 */
export interface LoginItemLogEntry {
  /** Event type */
  event: LoginItemEvent;
  /** Timestamp */
  timestamp: string;
  /** Login item label */
  label: string;
  /** State before the event */
  previousState?: LoginItemState;
  /** State after the event */
  newState?: LoginItemState;
  /** Registration method used */
  method?: AutoStartMethod;
  /** Error code if failed */
  errorCode?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event types for login item operations
 */
export enum LoginItemEvent {
  REGISTER = 'REGISTER',
  UNREGISTER = 'UNREGISTER',
  STATUS_CHECK = 'STATUS_CHECK',
  SYNC_WITH_SYSTEM = 'SYNC_WITH_SYSTEM',
  STATE_TRANSITION = 'STATE_TRANSITION',
  ERROR = 'ERROR',
  RETRY = 'RETRY',
  PATH_UPDATE = 'PATH_UPDATE',
}
