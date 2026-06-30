/**
 * Type definitions for login item entities
 * Feature: M3.4 Login Item Auto-Start
 */

/**
 * Valid states for a login item
 */
export enum LoginItemState {
  Disabled = 'Disabled',
  Enabled = 'Enabled',
  Error = 'Error',
}

/**
 * Method used for login item registration
 */
export enum AutoStartMethod {
  MyBoTeamDefaults = 'MyBoTeamDefaults',
  ServiceManagement = 'ServiceManagement',
}

/**
 * Represents a macOS login item registration
 */
export interface LoginItem {
  /** Unique identifier */
  id: string;
  /** Path to daemon binary (absolute path) */
  applicationPath: string;
  /** Login item label (non-empty, unique) */
  label: string;
  /** Current state */
  state: LoginItemState;
  /** ISO timestamp of last update */
  lastUpdated: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Error code if state=Error */
  errorCode?: string;
  /** Error message if state=Error */
  errorMessage?: string;
}

/**
 * User preference for auto-start functionality
 */
export interface AutoStartPreference {
  /** Unique identifier */
  id: string;
  /** Whether auto-start is enabled */
  enabled: boolean;
  /** Registration method used */
  method: AutoStartMethod;
  /** ISO timestamp of last state check */
  lastChecked: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Options for enabling auto-start
 */
export interface EnableOptions {
  /** Path to the daemon binary */
  applicationPath: string;
  /** Login item label */
  label: string;
  /** Registration method (optional, defaults to MyBoTeamDefaults) */
  method?: AutoStartMethod;
}

/**
 * Result of a registration operation
 */
export interface RegistrationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The method used for registration */
  method: AutoStartMethod;
  /** Error code if failed */
  errorCode?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Timestamp of the operation */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs?: number;
}

/**
 * Result of an unregistration operation
 */
export interface UnregistrationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error code if failed */
  errorCode?: string;
  /** Error message if failed */
  errorMessage?: string;
  /** Timestamp of the operation */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs?: number;
}

/**
 * Current status of a login item
 */
export interface LoginItemStatus {
  /** Whether auto-start is enabled */
  enabled: boolean;
  /** Current state */
  state: LoginItemState;
  /** Registration method used */
  method: AutoStartMethod;
  /** Whether the status matches the system state */
  synced: boolean;
  /** Timestamp of last check */
  lastChecked: string;
}

/**
 * Valid state transitions
 */
export const VALID_TRANSITIONS: Record<LoginItemState, LoginItemState[]> = {
  [LoginItemState.Disabled]: [LoginItemState.Enabled, LoginItemState.Error],
  [LoginItemState.Enabled]: [LoginItemState.Disabled, LoginItemState.Error],
  [LoginItemState.Error]: [LoginItemState.Disabled],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: LoginItemState, to: LoginItemState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Error codes for login item operations
 */
export enum LoginItemErrorCode {
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  UNREGISTRATION_FAILED = 'UNREGISTRATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_LABEL = 'INVALID_LABEL',
  DUPLICATE_REGISTRATION = 'DUPLICATE_REGISTRATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Default timeout for login item operations (5 seconds)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Default label for the daemon login item
 */
export const DEFAULT_LOGIN_ITEM_LABEL = 'com.mybot.daemon';
