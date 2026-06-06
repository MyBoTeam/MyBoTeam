import type { Task, TaskMessage } from '@myboteam/agent-core/desktop-main';
import { createMessageId } from '@myboteam/agent-core/desktop-main';
import type { BrowserWindow } from 'electron';
import { getLogCollector } from '../logging';
import { executeScenario } from './mock-task-flow-scenarios';
import type { MockScenario, MockTaskConfig } from './mock-task-flow-types';

export type { MockScenario, MockTaskConfig } from './mock-task-flow-types';

interface MockTaskStorage {
  saveTask(task: Task, workspaceId: string | null): void;
  addTaskMessage(taskId: string, message: TaskMessage): void;
  updateTaskStatus(taskId: string, status: string, timestamp: string): void;
}

const mockTaskStorage: MockTaskStorage = {
  saveTask: () => {},
  addTaskMessage: () => {},
  updateTaskStatus: () => {},
};

export function isMockTaskEventsEnabled(): boolean {
  return (
    (global as Record<string, unknown>).E2E_MOCK_TASK_EVENTS === true ||
    process.env.E2E_MOCK_TASK_EVENTS === '1'
  );
}

const SCENARIO_KEYWORDS: Record<MockScenario, string[]> = {
  success: ['__e2e_success__', 'test success'],
  'with-tool': ['__e2e_tool__', 'use tool', 'search files'],
  'permission-required': ['__e2e_permission__', 'write file', 'create file'],
  question: ['__e2e_question__'],
  error: ['__e2e_error__', 'cause error', 'trigger failure'],
  interrupted: ['__e2e_interrupt__', 'stop task', 'cancel task'],
  'code-block': ['__e2e_code__'],
};

export function detectScenarioFromPrompt(prompt: string): MockScenario {
  const promptLower = prompt.toLowerCase();

  const priorityOrder: MockScenario[] = [
    'error',
    'interrupted',
    'question',
    'permission-required',
    'code-block',
    'with-tool',
    'success',
  ];

  for (const scenario of priorityOrder) {
    const keywords = SCENARIO_KEYWORDS[scenario];
    if (keywords.some((keyword) => promptLower.includes(keyword.toLowerCase()))) {
      return scenario;
    }
  }

  return 'success';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeMockTaskFlow(
  window: BrowserWindow,
  config: MockTaskConfig,
): Promise<void> {
  const { taskId, prompt, scenario, delayMs = 100 } = config;

  if (window.isDestroyed()) {
    try {
      const l = getLogCollector();
      if (l?.log) {
        l.log('WARN', 'main', '[MockTaskFlow] Window destroyed, skipping mock flow');
      }
    } catch (_e) {
      /* best-effort logging */
    }
    return;
  }

  const storage = mockTaskStorage;
  const sendEvent = (channel: string, data: unknown) => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  };

  const sendMessage = (message: TaskMessage): void => {
    storage.addTaskMessage(taskId, message);
    sendEvent('task:update', {
      taskId,
      type: 'message',
      message,
    });
  };

  sendEvent('task:progress', { taskId, stage: 'init' });
  await sleep(delayMs);

  sendMessage({
    id: createMessageId(),
    type: 'assistant',
    content: `I'll help you with: ${prompt}`,
    timestamp: new Date().toISOString(),
  });
  await sleep(delayMs);

  await executeScenario(sendEvent, sendMessage, storage, taskId, scenario, delayMs);
}

export function createMockTask(taskId: string, prompt: string): Task {
  const initialMessage: TaskMessage = {
    id: createMessageId(),
    type: 'user',
    content: prompt,
    timestamp: new Date().toISOString(),
  };

  return {
    id: taskId,
    prompt,
    status: 'running',
    messages: [initialMessage],
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
  };
}
