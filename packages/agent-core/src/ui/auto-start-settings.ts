/**
 * Auto-start settings utility
 * Feature: M3.4 Login Item Auto-Start
 *
 * Provides structured data for auto-start settings.
 * Framework-agnostic - consumers can render with any UI framework.
 */

import type { AutoStartMethod, LoginItemStatus } from '../types/login-item.js';

/**
 * Status display data
 */
export interface StatusDisplayData {
  /** Whether auto-start is enabled */
  enabled: boolean;
  /** Human-readable status text */
  statusText: string;
  /** Status indicator (for icons/colors) */
  indicator: 'active' | 'inactive' | 'error';
  /** Current registration method */
  method: AutoStartMethod;
  /** Whether state is synced with system */
  synced: boolean;
}

/**
 * Action button data
 */
export interface ActionButtonData {
  /** Button label */
  label: string;
  /** Action type */
  action: 'enable' | 'disable' | 'refresh';
  /** Whether button is disabled */
  disabled: boolean;
}

/**
 * Settings view model
 */
export interface SettingsViewModel {
  /** Status display data */
  status: StatusDisplayData;
  /** Available actions */
  actions: ActionButtonData[];
  /** Error message if any */
  error: string | null;
  /** Whether loading */
  loading: boolean;
}

/**
 * Build status display data from LoginItemStatus
 */
export function buildStatusDisplay(status: LoginItemStatus | null): StatusDisplayData {
  if (!status) {
    return {
      enabled: false,
      statusText: 'Unknown',
      indicator: 'error',
      method: 'MyBoTeamDefaults' as AutoStartMethod,
      synced: false,
    };
  }

  return {
    enabled: status.enabled,
    statusText: status.enabled ? 'Auto-start enabled' : 'Auto-start disabled',
    indicator: status.enabled ? 'active' : 'inactive',
    method: status.method,
    synced: status.synced,
  };
}

/**
 * Build action buttons based on current status
 */
export function buildActionButtons(status: LoginItemStatus | null): ActionButtonData[] {
  const buttons: ActionButtonData[] = [];

  if (status?.enabled) {
    buttons.push({
      label: 'Disable Auto-Start',
      action: 'disable',
      disabled: false,
    });
  } else {
    buttons.push({
      label: 'Enable Auto-Start',
      action: 'enable',
      disabled: false,
    });
  }

  buttons.push({
    label: 'Refresh',
    action: 'refresh',
    disabled: false,
  });

  return buttons;
}

/**
 * Build complete settings view model
 */
export function buildSettingsViewModel(
  status: LoginItemStatus | null,
  loading: boolean = false,
  error: string | null = null,
): SettingsViewModel {
  return {
    status: buildStatusDisplay(status),
    actions: buildActionButtons(status),
    error,
    loading,
  };
}
