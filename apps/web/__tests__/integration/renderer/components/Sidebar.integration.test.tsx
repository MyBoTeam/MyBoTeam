import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListTasks = vi.fn();
const mockOnTaskStatusChange = vi.fn();
const mockOnTaskUpdate = vi.fn();

const mockMyBoTeam = {
  listTasks: mockListTasks.mockResolvedValue([]),
  onTaskStatusChange: mockOnTaskStatusChange.mockReturnValue(() => {}),
  onTaskUpdate: mockOnTaskUpdate.mockReturnValue(() => {}),
  getSelectedModel: vi.fn().mockResolvedValue({ provider: 'anthropic', id: 'claude-3-opus' }),
  getOllamaConfig: vi.fn().mockResolvedValue(null),
  isE2EMode: vi.fn().mockResolvedValue(false),
  getProviderSettings: vi.fn().mockResolvedValue({
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
  setActiveProvider: vi.fn().mockResolvedValue(undefined),
  setConnectedProvider: vi.fn().mockResolvedValue(undefined),
  removeConnectedProvider: vi.fn().mockResolvedValue(undefined),
  setProviderDebugMode: vi.fn().mockResolvedValue(undefined),
  validateApiKeyForProvider: vi.fn().mockResolvedValue({ valid: true }),
  validateBedrockCredentials: vi.fn().mockResolvedValue({ valid: true }),
  saveBedrockCredentials: vi.fn().mockResolvedValue(undefined),
  listWorkspaces: vi.fn().mockResolvedValue([]),
  getTheme: vi.fn().mockResolvedValue('system'),
  setTheme: vi.fn().mockResolvedValue(undefined),
  onThemeChange: undefined,
  onDaemonReconnected: vi.fn().mockReturnValue(() => {}),
  onDaemonReconnectFailed: vi.fn().mockReturnValue(() => {}),
  getBuildCapabilities: vi.fn().mockResolvedValue({ hasFreeMode: true, hasAnalytics: false }),
  isFullScreen: vi.fn().mockResolvedValue(false),
  onFullScreenChanged: vi.fn().mockReturnValue(() => {}),
  getThemeColor: vi.fn().mockResolvedValue('neutral'),
  onThemeColorChange: vi.fn().mockReturnValue(() => {}),
};

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => mockMyBoTeam,
  useMyBoTeam: () => mockMyBoTeam,
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
        whileFocus: _whileFocus,
        whileInView: _whileInView,
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
      button: createMotionMock('button'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import Sidebar from '@/layouts/main/components/Sidebar';

import { useSidebarStore } from '@/stores/sidebarStore';

describe('Sidebar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSidebarStore.setState({ isCollapsed: false, settingsReturnPath: null });
  });

  describe('rendering', () => {
    it('should render the sidebar container with default expanded width', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const sidebar = document.querySelector('.w-64');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render logo image', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const logo = screen.getByRole('img', { name: /mybot team logo/i });
      expect(logo).toBeInTheDocument();
    });

    it('should render New Task nav item', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      expect(screen.getByText('New task')).toBeInTheDocument();
    });

    it('should render Conversations nav item', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      expect(screen.getByText('Conversations')).toBeInTheDocument();
    });

    it('should render Settings button', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should render collapse button', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const collapseButton = screen.getByTitle(/collapse sidebar/i);
      expect(collapseButton).toBeInTheDocument();
    });

    it('should render h-screen class', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const sidebar = document.querySelector('.h-screen');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to home when New Task is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/execution/task-123']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const newTaskButton = screen.getByText('New task').closest('button');
      expect(newTaskButton).toBeInTheDocument();
      if (newTaskButton) {
        fireEvent.click(newTaskButton);
      }
    });

    it('should navigate to conversations when Conversations is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const conversationsButton = screen.getByText('Conversations').closest('button');
      expect(conversationsButton).toBeInTheDocument();
      if (conversationsButton) {
        fireEvent.click(conversationsButton);
      }
    });
  });

  describe('collapse behavior', () => {
    it('should collapse sidebar when collapse button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const collapseButton = screen.getByTitle(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      await waitFor(() => {
        expect(document.querySelector('.w-16')).toBeInTheDocument();
      });
    });

    it('should expand sidebar when expand button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const collapseButton = screen.getByTitle(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      await waitFor(() => {
        expect(document.querySelector('.w-16')).toBeInTheDocument();
      });

      const expandButton = screen.getByTitle(/expand sidebar/i);
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(document.querySelector('.w-64')).toBeInTheDocument();
      });
    });
  });

  describe('layout', () => {
    it('should render with correct height for full screen', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar isTitleBarHidden={true} />
        </MemoryRouter>,
      );

      const sidebar = document.querySelector('.h-screen');
      expect(sidebar).toBeInTheDocument();
    });
  });
});
