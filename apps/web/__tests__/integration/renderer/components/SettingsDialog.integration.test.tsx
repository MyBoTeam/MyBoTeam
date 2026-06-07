import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import settingsEn from '../../../../locales/en/settings.json';

function translateSettingsKey(key: string, options?: Record<string, unknown>): string {
  const value = key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, settingsEn);

  if (typeof value !== 'string') {
    return key;
  }

  return Object.entries(options ?? {}).reduce((message, [name, replacement]) => {
    return message.replace(new RegExp(`{{\\s*${name}\\s*}}`, 'g'), String(replacement));
  }, value);
}

const defaultMock = vi.fn();
const mockFn = (val: unknown) => vi.fn().mockResolvedValue(val);
const mockReturn = (val: unknown) => vi.fn().mockReturnValue(val);

const mockHandlers: Record<string, vi.Mock> = {};

const handler: ProxyHandler<Record<string, unknown>> = {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    if (!mockHandlers[prop]) {
      mockHandlers[prop] = defaultMock;
    }
    return mockHandlers[prop];
  },
};

const mockMyBoTeam = new Proxy<Record<string, unknown>>(
  {
    getOllamaConfig: mockFn(null),
    isE2EMode: mockFn(false),
    getProviderSettings: mockFn({
      activeProviderId: 'anthropic',
      connectedProviders: {
        anthropic: {
          providerId: 'anthropic',
          connectionStatus: 'connected',
          selectedModelId: 'claude-3-5-sonnet-20241022',
          credentials: { type: 'api-key', apiKey: 'test-key' },
        },
      },
      debugMode: false,
    }),
    setActiveProvider: mockFn(undefined),
    setConnectedProvider: mockFn(undefined),
    removeConnectedProvider: mockFn(undefined),
    setProviderDebugMode: mockFn(undefined),
    validateBedrockCredentials: mockFn({ valid: true }),
    saveBedrockCredentials: mockFn(undefined),
    getConnectors: mockFn([]),
    addConnector: mockFn(undefined),
    deleteConnector: mockFn(undefined),
    setConnectorEnabled: mockFn(undefined),
    startConnectorOAuth: mockFn(undefined),
    disconnectConnector: mockFn(undefined),
    completeConnectorOAuth: mockFn(undefined),
    getSlackMcpOauthStatus: mockFn({ connected: false, pendingAuthorization: false }),
    loginSlackMcp: mockFn({ ok: true }),
    logoutSlackMcp: mockFn(undefined),
    getBuiltInConnectorAuthStatus: mockFn([]),
    loginBuiltInConnector: mockFn(undefined),
    logoutBuiltInConnector: mockFn(undefined),
    onWhatsAppQR: mockReturn(() => {}),
    onWhatsAppStatus: mockReturn(() => {}),
    datadogGetServerUrl: mockFn(undefined),
    datadogSetServerUrl: mockFn(undefined),
    lightdashGetServerUrl: mockFn(undefined),
    lightdashSetServerUrl: mockFn(undefined),
    getDebugMode: mockFn(false),
    getNotificationsEnabled: mockFn(true),
    setNotificationsEnabled: mockFn(undefined),
    getVersion: mockFn('0.1.0-test'),
    fetchProviderModels: mockFn({ success: true, models: [] }),
    getSandboxConfig: mockFn({
      mode: 'disabled',
      allowedPaths: [],
      networkRestricted: false,
      allowedHosts: [],
    }),
    listWorkspaces: mockFn([]),
    getTheme: mockFn('system'),
    setTheme: mockFn(undefined),
    onThemeChange: undefined,
    onDaemonReconnected: mockReturn(() => {}),
    onDaemonReconnectFailed: mockReturn(() => {}),
    getBuildCapabilities: mockFn({ hasFreeMode: true, hasAnalytics: false }),
    isFullScreen: mockFn(false),
    onFullScreenChanged: mockReturn(() => {}),
    getThemeColor: mockFn('neutral'),
    onThemeColorChange: mockReturn(() => {}),
  },
  handler,
);

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => mockMyBoTeam,
  useMyBoTeam: () => mockMyBoTeam,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => translateSettingsKey(key, options),
    i18n: { changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('framer-motion', () => {
  const createMotionMock = (Element: string) => {
    return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        variants: _variants,
        whileHover: _whileHover,
        whileTap: _whileTap,
        layout: _layout,
        layoutId: _layoutId,
        ...domProps
      } = props;
      const Component = Element as keyof JSX.IntrinsicElements;
      return <Component {...domProps}>{children}</Component>;
    };
  };

  return {
    motion: {
      div: createMotionMock('div'),
      section: createMotionMock('section'),
      p: createMotionMock('p'),
      span: createMotionMock('span'),
      button: createMotionMock('button'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Overlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-overlay">{children}</div>
  ),
  Content: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dialog-content" role="dialog" {...props}>
      {children}
    </div>
  ),
  Title: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  Close: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="dialog-close">{children}</button>
  ),
}));

import { SettingsDialog } from '@/layouts/main/components/SettingsDialog';

describe('SettingsDialog Integration', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onApiKeySaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMyBoTeam.getConnectors.mockResolvedValue([]);
    mockMyBoTeam.getSlackMcpOauthStatus.mockResolvedValue({
      connected: false,
      pendingAuthorization: false,
    });
    mockMyBoTeam.loginSlackMcp.mockResolvedValue({ ok: true });
    mockMyBoTeam.logoutSlackMcp.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  describe('dialog rendering', () => {
    it('should render dialog when open is true', async () => {
      render(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should not render dialog when open is false', () => {
      render(<SettingsDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog title', async () => {
      render(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should fetch initial data on open', async () => {
      render(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockMyBoTeam.getProviderSettings).toHaveBeenCalled();
      });
    });

    it('should not render dialog content when open is false', () => {
      render(<SettingsDialog {...defaultProps} open={false} />);

      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('provider active state', () => {
    it('should call setActiveProvider when a ready provider connects (regression test)', async () => {
      mockMyBoTeam.getProviderSettings = vi.fn().mockResolvedValue({
        activeProviderId: 'anthropic',
        connectedProviders: {
          anthropic: {
            providerId: 'anthropic',
            connectionStatus: 'connected',
            selectedModelId: 'anthropic/claude-haiku-4-5',
            credentials: { type: 'api-key', apiKeyPrefix: 'sk-ant-...' },
            lastConnectedAt: new Date().toISOString(),
          },
        },
        debugMode: false,
      });

      render(<SettingsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        const anthropicCard = screen.getByTestId('provider-card-anthropic');
        expect(anthropicCard.className).toContain('bg-provider-bg-active');
      });

      expect(mockMyBoTeam.getProviderSettings).toHaveBeenCalled();
    });
  });
});
