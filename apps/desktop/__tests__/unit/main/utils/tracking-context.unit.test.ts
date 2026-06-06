import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.2.3'),
    isPackaged: false,
  },
  session: {
    defaultSession: {
      getUserAgent: vi.fn(() => 'Mozilla/5.0 (Electron)'),
    },
  },
}));

const mockGetAnalyticsSessionId = vi.hoisted(() => vi.fn(() => 'session-abc'));
const mockGetClientId = vi.hoisted(() => vi.fn(() => 'client-xyz'));
const mockGetDeviceFingerprint = vi.hoisted(() => vi.fn(() => 'fp-123'));
const mockGetFirstLaunchVersion = vi.hoisted(() => vi.fn(() => '1.0.0'));
const mockGetFirstSeenAt = vi.hoisted(() => vi.fn(() => '2024-01-01T00:00:00Z'));

vi.mock('@main/analytics/analytics-service', () => ({
  getAnalyticsSessionId: mockGetAnalyticsSessionId,
  getClientId: mockGetClientId,
  getDeviceFingerprint: mockGetDeviceFingerprint,
  getFirstLaunchVersion: mockGetFirstLaunchVersion,
  getFirstSeenAt: mockGetFirstSeenAt,
}));

vi.mock('@main/config/build-config', () => ({
  getAppTier: vi.fn(() => 'oss'),
}));

import {
  buildCommonTrackingFields,
  getBrowserUserAgent,
  setBrowserUserAgent,
} from '@main/utils/tracking-context';

describe('tracking-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildCommonTrackingFields', () => {
    it('should return all tracking fields with browser_user_agent undefined when not set', () => {
      const fields = buildCommonTrackingFields();

      expect(fields).toStrictEqual({
        platform: process.platform,
        app_version: '1.2.3',
        ga_session_id: 'session-abc',
        environment: 'dev',
        user_id: 'fp-123',
        ga_client_id: 'client-xyz',
        arch: process.arch,
        os_name: expect.any(String),
        os_version: expect.any(String),
        timezone: expect.any(String),
        plan_type: 'oss',
        deployment_type: 'saas',
        org_id: 'none',
        user_role: 'user',
        electron_user_agent: 'Mozilla/5.0 (Electron)',
        browser_user_agent: undefined,
        first_launched_at: '2024-01-01T00:00:00Z',
        first_app_version: '1.0.0',
      });
    });

    it('should include browser_user_agent when previously set', () => {
      setBrowserUserAgent('Mozilla/5.0 Chrome/120');
      const fields = buildCommonTrackingFields();
      expect(fields.browser_user_agent).toBe('Mozilla/5.0 Chrome/120');
    });

    it('should map platform names correctly', () => {
      const fields = buildCommonTrackingFields();
      const expectedMap: Record<string, string> = {
        darwin: 'macOS',
        win32: 'Windows',
        linux: 'Linux',
      };
      expect(fields.os_name).toBe(expectedMap[process.platform] || process.platform);
    });

    it('should set environment to production when packaged', async () => {
      const mod = await import('electron');
      (mod.app.isPackaged as boolean) = true;

      const fields = buildCommonTrackingFields();
      expect(fields.environment).toBe('production');

      (mod.app.isPackaged as boolean) = false;
    });
  });

  describe('getBrowserUserAgent / setBrowserUserAgent', () => {
    it('should store and retrieve the browser user agent', () => {
      setBrowserUserAgent('Mozilla/5.0 Chrome/120');
      expect(getBrowserUserAgent()).toBe('Mozilla/5.0 Chrome/120');
    });

    it('should overwrite previous browser user agent', () => {
      setBrowserUserAgent('first');
      setBrowserUserAgent('second');
      expect(getBrowserUserAgent()).toBe('second');
    });
  });
});
