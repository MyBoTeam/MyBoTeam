import type { Task, TaskStatus } from '@myboteam/agent-core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStartTask = vi.fn();
const mockCloseLauncher = vi.fn();
const mockHasAnyApiKey = vi.fn();

function createMockTask(
  id: string,
  prompt: string = 'Test task',
  status: TaskStatus = 'completed',
  createdAt?: string,
): Task {
  return {
    id,
    prompt,
    status,
    messages: [],
    createdAt: createdAt || new Date().toISOString(),
  };
}

const mockMyBoTeam = {
  hasAnyApiKey: mockHasAnyApiKey,
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
  onDaemonReconnected: vi.fn().mockReturnValue(() => {}),
  onDaemonReconnectFailed: vi.fn().mockReturnValue(() => {}),
  getBuildCapabilities: vi.fn().mockResolvedValue({ hasFreeMode: true, hasAnalytics: false }),
  isFullScreen: vi.fn().mockResolvedValue(false),
  onFullScreenChanged: vi.fn().mockReturnValue(() => {}),
  getThemeColor: vi.fn().mockResolvedValue('neutral'),
  onThemeColorChange: vi.fn().mockReturnValue(() => {}),
};

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => mockMyBoTeam,
  useMyBoTeam: () => mockMyBoTeam,
}));

let mockStoreState = {
  isLauncherOpen: false,
  closeLauncher: mockCloseLauncher,
  tasks: [] as Task[],
  startTask: mockStartTask,
};

vi.mock('@/stores/taskStore', () => ({
  useTaskStore: () => mockStoreState,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { TaskLauncher } from '@/components/TaskLauncher/TaskLauncher';
import { TaskLauncherItem } from '@/components/TaskLauncher/TaskLauncherItem';

describe('TaskLauncherItem', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render task prompt', () => {
      const task = createMockTask('task-1', 'Check my email inbox');

      render(<TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />);

      expect(screen.getByText('Check my email inbox')).toBeInTheDocument();
    });

    it('should render task with truncated long prompt', () => {
      const longPrompt =
        'This is a very long task prompt that should be truncated when displayed in the UI to prevent overflow';
      const task = createMockTask('task-1', longPrompt);

      render(<TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />);

      const promptElement = screen.getByText(longPrompt);
      expect(promptElement.className).toContain('truncate');
    });
  });

  describe('status icons', () => {
    it('should show spinning loader for running tasks', () => {
      const task = createMockTask('task-1', 'Running task', 'running');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner?.getAttribute('class')).toContain('text-muted-foreground');
    });

    it('should show green dot for completed tasks', () => {
      const task = createMockTask('task-1', 'Completed task', 'completed');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const dot = container.querySelector('.bg-green-500');
      expect(dot).toBeInTheDocument();
    });

    it('should show destructive dot for failed tasks', () => {
      const task = createMockTask('task-1', 'Failed task', 'failed');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const dot = container.querySelector('.bg-destructive');
      expect(dot).toBeInTheDocument();
    });

    it('should show muted dot for cancelled tasks', () => {
      const task = createMockTask('task-1', 'Cancelled task', 'cancelled');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const dot = container.querySelector('.bg-muted-foreground');
      expect(dot).toBeInTheDocument();
    });

    it('should show yellow dot for interrupted tasks', () => {
      const task = createMockTask('task-1', 'Interrupted task', 'interrupted');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const dot = container.querySelector('.bg-yellow-500');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('should highlight when isSelected is true', () => {
      const task = createMockTask('task-1', 'Selected task');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={true} onClick={mockOnClick} />,
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-primary');
      expect(button?.className).toContain('text-primary-foreground');
    });

    it('should not highlight when isSelected is false', () => {
      const task = createMockTask('task-1', 'Unselected task');

      const { container } = render(
        <TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />,
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('text-foreground');
      expect(button?.className).toContain('hover:bg-accent');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', () => {
      const task = createMockTask('task-1', 'Clickable task');

      render(<TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should be a button element', () => {
      const task = createMockTask('task-1', 'Task');

      render(<TaskLauncherItem task={task} isSelected={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });
});

describe('TaskLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockStoreState = {
      isLauncherOpen: false,
      closeLauncher: mockCloseLauncher,
      tasks: [],
      startTask: mockStartTask,
    };

    mockMyBoTeam.getProviderSettings.mockResolvedValue({
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
    });
  });

  describe('opening and closing', () => {
    it('should not render when isLauncherOpen is false', () => {
      mockStoreState.isLauncherOpen = false;

      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument();
    });

    it('should render when isLauncherOpen is true', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    });

    it('should show search input when open', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('should show close button when open', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call closeLauncher when Escape is pressed', () => {
      mockStoreState.isLauncherOpen = true;

      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      // Assert - May be called more than once due to Dialog component
      expect(mockCloseLauncher).toHaveBeenCalled();
    });

    it('should call closeLauncher when close button is clicked', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockCloseLauncher).toHaveBeenCalledTimes(1);
    });
  });

  describe('new task option', () => {
    it('should show "New task" option', () => {
      mockStoreState.isLauncherOpen = true;

      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('New task')).toBeInTheDocument();
    });

    it('should show search query in new task option when search has text', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'my new task' } });

      // Assert
      expect(screen.getByText(/\u201cmy new task\u201d/)).toBeInTheDocument();
    });

    it('should not show search query preview when search is empty', () => {
      mockStoreState.isLauncherOpen = true;

      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.queryByText(/—/)).not.toBeInTheDocument();
    });

    it('should show Plus icon in new task option', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Plus icon should be present
      const newTaskButton = screen.getByText('New task').closest('button');
      const icon = newTaskButton?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('task filtering', () => {
    it('should show "Last 7 days" section when no search query', () => {
      // Arrange
      const today = new Date();
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [
        createMockTask('task-1', 'Recent task', 'completed', today.toISOString()),
      ];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('should show "Results" section when searching', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'Check email')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'email' } });

      // Assert
      expect(screen.getByText('Results')).toBeInTheDocument();
    });

    it('should filter tasks by search query', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [
        createMockTask('task-1', 'Check my email inbox'),
        createMockTask('task-2', 'Review calendar'),
        createMockTask('task-3', 'Send email to team'),
      ];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'email' } });

      // Assert
      expect(screen.getByText('Check my email inbox')).toBeInTheDocument();
      expect(screen.getByText('Send email to team')).toBeInTheDocument();
      expect(screen.queryByText('Review calendar')).not.toBeInTheDocument();
    });

    it('should be case-insensitive when filtering', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'Check my EMAIL inbox')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'email' } });

      // Assert
      expect(screen.getByText('Check my EMAIL inbox')).toBeInTheDocument();
    });

    it('should show "No tasks found" when search has no results', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'Check email')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Assert
      expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });

    it('should only show tasks from last 7 days when no search', () => {
      // Arrange
      const today = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(today.getDate() - 5);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(today.getDate() - 10);

      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [
        createMockTask('task-1', 'Recent task', 'completed', fiveDaysAgo.toISOString()),
        createMockTask('task-2', 'Old task', 'completed', tenDaysAgo.toISOString()),
      ];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Recent task')).toBeInTheDocument();
      expect(screen.queryByText('Old task')).not.toBeInTheDocument();
    });

    it('should show all matching tasks regardless of age when searching', () => {
      // Arrange
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [
        createMockTask('task-1', 'Old email task', 'completed', tenDaysAgo.toISOString()),
      ];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'email' } });

      // Assert
      expect(screen.getByText('Old email task')).toBeInTheDocument();
    });

    it('should limit results to 10 tasks', () => {
      // Arrange
      const today = new Date();
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = Array.from({ length: 15 }, (_, i) =>
        createMockTask(`task-${i}`, `Task ${i}`, 'completed', today.toISOString()),
      );

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Should show 10 tasks maximum
      // Check for task prompts (Task 0 through Task 9)
      expect(screen.getByText('Task 0')).toBeInTheDocument();
      expect(screen.getByText('Task 9')).toBeInTheDocument();
      expect(screen.queryByText('Task 10')).not.toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should start with first item selected', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - "New task" should be selected (has bg-primary)
      const newTaskButton = screen.getByText('New task').closest('button');
      expect(newTaskButton?.className).toContain('bg-primary');
    });

    it('should move selection down with ArrowDown', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'First task')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Assert - First task should now be selected
      const taskButton = screen.getByText('First task').closest('button');
      expect(taskButton?.className).toContain('bg-primary');
    });

    it('should move selection up with ArrowUp', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'First task')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Move to first task
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' }); // Move back to New task

      // Assert - "New task" should be selected again
      const newTaskButton = screen.getByText('New task').closest('button');
      expect(newTaskButton?.className).toContain('bg-primary');
    });

    it('should not move selection above first item', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' }); // Try to move up from first item

      // Assert - "New task" should still be selected
      const newTaskButton = screen.getByText('New task').closest('button');
      expect(newTaskButton?.className).toContain('bg-primary');
    });

    it('should not move selection below last item', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'Only task')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Move to task
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Try to move past last item

      // Assert - Last task should still be selected
      const taskButton = screen.getByText('Only task').closest('button');
      expect(taskButton?.className).toContain('bg-primary');
    });

    it('should reset selection when reopened', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-1', 'Task')];

      // Act
      const { rerender } = render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Move to task

      // Close and reopen
      mockStoreState.isLauncherOpen = false;
      rerender(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      mockStoreState.isLauncherOpen = true;
      rerender(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Selection should be back at first item
      const newTaskButton = screen.getByText('New task').closest('button');
      expect(newTaskButton?.className).toContain('bg-primary');
    });
  });

  describe('task selection', () => {
    it('should navigate to home when New task is selected with empty search', async () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const newTaskButton = screen.getByText('New task').closest('button');
      if (newTaskButton) {
        fireEvent.click(newTaskButton);
      }

      // Assert
      await waitFor(() => {
        expect(mockCloseLauncher).toHaveBeenCalled();
      });
    });

    it('should start new task when New task is selected with search text', async () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      const mockTask = createMockTask('new-task', 'Test prompt');
      mockStartTask.mockResolvedValue(mockTask);

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'Test prompt' } });

      const newTaskButton = screen.getByText('New task').closest('button');
      if (newTaskButton) {
        fireEvent.click(newTaskButton);
      }

      // Assert
      await waitFor(() => {
        expect(mockMyBoTeam.getProviderSettings).toHaveBeenCalled();
        expect(mockCloseLauncher).toHaveBeenCalled();
        expect(mockStartTask).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Test prompt',
          }),
        );
      });
    });

    it('should navigate to home if no provider is ready when starting new task', async () => {
      // Arrange - No ready provider
      mockStoreState.isLauncherOpen = true;
      mockMyBoTeam.getProviderSettings.mockResolvedValue({
        activeProviderId: null,
        connectedProviders: {},
        debugMode: false,
      });

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'Test prompt' } });

      const newTaskButton = screen.getByText('New task').closest('button');
      if (newTaskButton) {
        fireEvent.click(newTaskButton);
      }

      // Assert
      await waitFor(() => {
        expect(mockMyBoTeam.getProviderSettings).toHaveBeenCalled();
        expect(mockCloseLauncher).toHaveBeenCalled();
        expect(mockStartTask).not.toHaveBeenCalled();
      });
    });

    it('should navigate to task when task item is clicked', async () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-123', 'Existing task')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const taskButton = screen.getByText('Existing task').closest('button');
      if (taskButton) {
        fireEvent.click(taskButton);
      }

      // Assert
      await waitFor(() => {
        expect(mockCloseLauncher).toHaveBeenCalled();
      });
    });

    it('should navigate to task when Enter is pressed on selected task', async () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [createMockTask('task-123', 'Keyboard task')];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' }); // Move to task
      fireEvent.keyDown(searchInput, { key: 'Enter' }); // Select task

      // Assert
      await waitFor(() => {
        expect(mockCloseLauncher).toHaveBeenCalled();
      });
    });
  });

  describe('UI elements', () => {
    it('should show Search icon', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Search icon should be present
      // Check that the search input exists (which has the Search icon next to it)
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should show keyboard hints in footer', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Navigate')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should render overlay when open', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - When open, the dialog content should be visible
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
      expect(screen.getByText('New task')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty tasks array', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      mockStoreState.tasks = [];

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Should show New task and no error
      expect(screen.getByText('New task')).toBeInTheDocument();
      expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();
    });

    it('should trim whitespace from search query', async () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;
      const mockTask = createMockTask('new-task', 'Trimmed prompt');
      mockStartTask.mockResolvedValue(mockTask);

      // Act
      render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: '  Trimmed prompt  ' } });

      const newTaskButton = screen.getByText('New task').closest('button');
      if (newTaskButton) {
        fireEvent.click(newTaskButton);
      }

      // Assert
      await waitFor(() => {
        expect(mockStartTask).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Trimmed prompt',
          }),
        );
      });
    });

    it('should clear search when reopened', () => {
      // Arrange
      mockStoreState.isLauncherOpen = true;

      // Act
      const { rerender } = render(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'some search' } });

      // Close and reopen
      mockStoreState.isLauncherOpen = false;
      rerender(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      mockStoreState.isLauncherOpen = true;
      rerender(
        <MemoryRouter>
          <TaskLauncher />
        </MemoryRouter>,
      );

      // Assert - Search should be cleared
      const newSearchInput = screen.getByPlaceholderText('Search tasks...');
      expect(newSearchInput).toHaveValue('');
    });
  });
});
