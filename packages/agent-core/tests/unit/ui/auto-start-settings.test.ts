/**
 * Tests for auto-start settings view model builders
 * Feature: M3.4 Login Item Auto-Start
 */

import { describe, expect, it } from 'vitest';
import type { LoginItemStatus } from '../../../src/types/login-item.js';
import { AutoStartMethod, LoginItemState } from '../../../src/types/login-item.js';
import {
  buildActionButtons,
  buildSettingsViewModel,
  buildStatusDisplay,
} from '../../../src/ui/auto-start-settings.js';

describe('buildStatusDisplay', () => {
  it('returns unknown status when null', () => {
    const result = buildStatusDisplay(null);
    expect(result.enabled).toBe(false);
    expect(result.statusText).toBe('Unknown');
    expect(result.indicator).toBe('error');
    expect(result.synced).toBe(false);
  });

  it('returns enabled status when auto-start is enabled', () => {
    const status: LoginItemStatus = {
      enabled: true,
      state: LoginItemState.Enabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const result = buildStatusDisplay(status);
    expect(result.enabled).toBe(true);
    expect(result.statusText).toBe('Auto-start enabled');
    expect(result.indicator).toBe('active');
    expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    expect(result.synced).toBe(true);
  });

  it('returns disabled status when auto-start is disabled', () => {
    const status: LoginItemStatus = {
      enabled: false,
      state: LoginItemState.Disabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const result = buildStatusDisplay(status);
    expect(result.enabled).toBe(false);
    expect(result.statusText).toBe('Auto-start disabled');
    expect(result.indicator).toBe('inactive');
  });
});

describe('buildActionButtons', () => {
  it('shows enable button when disabled', () => {
    const status: LoginItemStatus = {
      enabled: false,
      state: LoginItemState.Disabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const buttons = buildActionButtons(status);
    expect(buttons[0].label).toBe('Enable Auto-Start');
    expect(buttons[0].action).toBe('enable');
    expect(buttons[0].disabled).toBe(false);
  });

  it('shows disable button when enabled', () => {
    const status: LoginItemStatus = {
      enabled: true,
      state: LoginItemState.Enabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const buttons = buildActionButtons(status);
    expect(buttons[0].label).toBe('Disable Auto-Start');
    expect(buttons[0].action).toBe('disable');
    expect(buttons[0].disabled).toBe(false);
  });

  it('always includes refresh button', () => {
    const status: LoginItemStatus = {
      enabled: false,
      state: LoginItemState.Disabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const buttons = buildActionButtons(status);
    expect(buttons).toHaveLength(2);
    expect(buttons[1].label).toBe('Refresh');
    expect(buttons[1].action).toBe('refresh');
  });

  it('shows enable button when status is null', () => {
    const buttons = buildActionButtons(null);
    expect(buttons[0].label).toBe('Enable Auto-Start');
    expect(buttons[0].action).toBe('enable');
  });
});

describe('buildSettingsViewModel', () => {
  it('builds complete view model with status', () => {
    const status: LoginItemStatus = {
      enabled: true,
      state: LoginItemState.Enabled,
      method: AutoStartMethod.MyBoTeamDefaults,
      synced: true,
      lastChecked: new Date().toISOString(),
    };
    const vm = buildSettingsViewModel(status, false, null);
    expect(vm.status.enabled).toBe(true);
    expect(vm.actions).toHaveLength(2);
    expect(vm.loading).toBe(false);
    expect(vm.error).toBeNull();
  });

  it('builds view model with loading state', () => {
    const vm = buildSettingsViewModel(null, true, null);
    expect(vm.loading).toBe(true);
    expect(vm.status.indicator).toBe('error');
  });

  it('builds view model with error', () => {
    const vm = buildSettingsViewModel(null, false, 'Permission denied');
    expect(vm.error).toBe('Permission denied');
  });
});
