import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.2.3'),
    isPackaged: false,
  },
}));

const mockSentryInit = vi.hoisted(() => vi.fn());
const mockSentrySetTag = vi.hoisted(() => vi.fn());
const mockSentrySetUser = vi.hoisted(() => vi.fn());
vi.mock('@sentry/electron/main', () => ({
  init: mockSentryInit,
  setTag: mockSentrySetTag,
  setUser: mockSentrySetUser,
}));

const mockGetBuildConfig = vi.hoisted(() => vi.fn());
const mockGetAppTier = vi.hoisted(() => vi.fn());
vi.mock('@main/config/build-config', () => ({
  getBuildConfig: mockGetBuildConfig,
  getAppTier: mockGetAppTier,
}));

const mockComputeDeviceFingerprint = vi.hoisted(() => vi.fn());
vi.mock('@main/identity/device-fingerprint', () => ({
  computeDeviceFingerprint: mockComputeDeviceFingerprint,
}));

vi.mock('@main/sentry-scrub', () => ({
  scrubBreadcrumb: vi.fn(),
  scrubEvent: vi.fn(),
}));

import { initSentry } from '@main/sentry';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not initialize Sentry when DSN is not configured', () => {
    mockGetBuildConfig.mockReturnValue({ sentryDsn: '' });
    initSentry();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it('should initialize Sentry with correct config when DSN is present', () => {
    mockGetBuildConfig.mockReturnValue({ sentryDsn: 'https://key@sentry.io/project' });
    mockGetAppTier.mockReturnValue('oss');
    mockComputeDeviceFingerprint.mockReturnValue('abc123');

    initSentry();

    expect(mockSentryInit).toHaveBeenCalledWith({
      dsn: 'https://key@sentry.io/project',
      release: '1.2.3',
      dist: 'desktop-main-oss',
      environment: 'development',
      beforeSend: expect.any(Function),
      beforeBreadcrumb: expect.any(Function),
    });

    expect(mockSentrySetTag).toHaveBeenCalledWith('appTier', 'oss');
    expect(mockSentrySetTag).toHaveBeenCalledWith('arch', process.arch);
    expect(mockSentrySetTag).toHaveBeenCalledWith('platform', process.platform);
    expect(mockSentrySetTag).toHaveBeenCalledWith('electronVersion', process.versions.electron);
    expect(mockSentrySetTag).toHaveBeenCalledWith('deviceId', 'abc123');
    expect(mockSentrySetUser).toHaveBeenCalledWith({ id: 'abc123' });
  });

  it('should not set user when device fingerprint is null', () => {
    mockGetBuildConfig.mockReturnValue({ sentryDsn: 'https://key@sentry.io/project' });
    mockGetAppTier.mockReturnValue('oss');
    mockComputeDeviceFingerprint.mockReturnValue(null);

    initSentry();

    expect(mockSentrySetUser).not.toHaveBeenCalled();
  });

  it('should handle initialization failure gracefully', () => {
    mockGetBuildConfig.mockReturnValue({ sentryDsn: 'https://key@sentry.io/project' });
    mockGetAppTier.mockReturnValue('oss');
    mockSentryInit.mockImplementation(() => {
      throw new Error('init failed');
    });

    expect(() => initSentry()).not.toThrow();
  });
});
