/**
 * System state query logic for login items
 * Feature: M3.4 Login Item Auto-Start
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { LoginItemStatus } from '../types/login-item.js';
import { AutoStartMethod, LoginItemState } from '../types/login-item.js';

const execAsync = promisify(exec);

/**
 * Query macOS system for login item registration state
 */
export async function querySystemLoginItem(label: string): Promise<{
  registered: boolean;
  method: AutoStartMethod | null;
  path: string | null;
}> {
  try {
    // Use `sfltool` to query login items (macOS 13+)
    const { stdout } = await execAsync('sfltool dumpbtm 2>/dev/null || true');

    // Parse output to find our login item
    const lines = stdout.split('\n');
    let found = false;
    let method: AutoStartMethod | null = null;
    const path: string | null = null;

    for (const line of lines) {
      // Check for our daemon label
      if (line.includes(label)) {
        found = true;

        // Determine method based on registration type
        if (line.includes('LoginItem') || line.includes('SMAppService')) {
          method = AutoStartMethod.ServiceManagement;
        } else {
          method = AutoStartMethod.MyBoTeamDefaults;
        }
      }
    }

    // Fallback: check via osascript if sfltool doesn't work
    if (!found) {
      try {
        const { stdout: osascriptOutput } = await execAsync(
          `osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null || true`,
        );

        if (osascriptOutput.includes(label)) {
          found = true;
          method = AutoStartMethod.MyBoTeamDefaults;
        }
      } catch {
        // osascript not available or permissions denied
      }
    }

    return {
      registered: found,
      method,
      path,
    };
  } catch {
    // Command failed - likely permissions issue or macOS version mismatch
    return {
      registered: false,
      method: null,
      path: null,
    };
  }
}

/**
 * Check if a specific path is registered as a login item
 */
export async function isPathRegistered(label: string, expectedPath: string): Promise<boolean> {
  const result = await querySystemLoginItem(label);

  if (!result.registered) {
    return false;
  }

  // If we have a path from the system, compare it
  if (result.path) {
    return result.path === expectedPath;
  }

  // If we can't determine path, assume it matches
  return true;
}

/**
 * Build LoginItemStatus from system query
 */
export function buildStatusFromSystemQuery(
  queryResult: { registered: boolean; method: AutoStartMethod | null; path: string | null },
  localEnabled: boolean,
): LoginItemStatus {
  // Determine effective enabled state
  // If system shows registered and local says enabled, trust system
  // If system shows not registered but local says enabled, external change detected
  const enabled = queryResult.registered;
  const synced = queryResult.registered === localEnabled;

  return {
    enabled,
    state: enabled ? LoginItemState.Enabled : LoginItemState.Disabled,
    method: queryResult.method || AutoStartMethod.MyBoTeamDefaults,
    synced,
    lastChecked: new Date().toISOString(),
  };
}
