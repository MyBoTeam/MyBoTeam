import type { TaskMessage } from '@myboteam/agent-core/desktop-main';
import { createMessageId } from '@myboteam/agent-core/desktop-main';
import {
  executeCodeBlockScenario,
  executeErrorScenario,
  executeInterruptedScenario,
} from './mock-task-flow-scenarios-more';
import type { MockEventSender, MockScenario } from './mock-task-flow-types';

interface ScenarioStorage {
  addTaskMessage(taskId: string, message: TaskMessage): void;
  updateTaskStatus(taskId: string, status: string, timestamp: string): void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeScenario(
  sendEvent: MockEventSender,
  sendMessage: (message: TaskMessage) => void,
  storage: ScenarioStorage,
  taskId: string,
  scenario: MockScenario,
  delayMs: number,
): Promise<void> {
  switch (scenario) {
    case 'success':
      await executeSuccessScenario(sendEvent, sendMessage, storage, taskId, delayMs);
      break;
    case 'with-tool':
      await executeToolScenario(sendEvent, sendMessage, storage, taskId, delayMs);
      break;
    case 'permission-required':
      executePermissionScenario(sendEvent, taskId);
      break;
    case 'question':
      executeQuestionScenario(sendEvent, taskId);
      break;
    case 'error':
      executeErrorScenario(sendEvent, storage, taskId);
      break;
    case 'interrupted':
      await executeInterruptedScenario(sendEvent, sendMessage, storage, taskId, delayMs);
      break;
    case 'code-block':
      await executeCodeBlockScenario(sendEvent, sendMessage, storage, taskId, delayMs);
      break;
  }
}

async function executeSuccessScenario(
  sendEvent: MockEventSender,
  sendMessage: (message: TaskMessage) => void,
  storage: ScenarioStorage,
  taskId: string,
  delayMs: number,
): Promise<void> {
  sendMessage({
    id: createMessageId(),
    type: 'assistant',
    content: 'Task completed successfully.',
    timestamp: new Date().toISOString(),
  });
  await sleep(delayMs);

  storage.updateTaskStatus(taskId, 'completed', new Date().toISOString());

  sendEvent('task:update', {
    taskId,
    type: 'complete',
    result: { status: 'success', sessionId: `session_${taskId}` },
  });
}

async function executeToolScenario(
  sendEvent: MockEventSender,
  sendMessage: (message: TaskMessage) => void,
  storage: ScenarioStorage,
  taskId: string,
  delayMs: number,
): Promise<void> {
  sendEvent('task:update:batch', {
    taskId,
    messages: [
      {
        id: createMessageId(),
        type: 'tool',
        content: 'Reading files',
        toolName: 'Read',
        timestamp: new Date().toISOString(),
      },
      {
        id: createMessageId(),
        type: 'tool',
        content: 'Searching code',
        toolName: 'Grep',
        timestamp: new Date().toISOString(),
      },
    ],
  });
  await sleep(delayMs * 2);

  sendMessage({
    id: createMessageId(),
    type: 'assistant',
    content: 'Found the information using available tools.',
    timestamp: new Date().toISOString(),
  });
  await sleep(delayMs);

  storage.updateTaskStatus(taskId, 'completed', new Date().toISOString());

  sendEvent('task:update', {
    taskId,
    type: 'complete',
    result: { status: 'success', sessionId: `session_${taskId}` },
  });
}

function executePermissionScenario(sendEvent: MockEventSender, taskId: string): void {
  sendEvent('permission:request', {
    id: `perm_${Date.now()}`,
    taskId,
    type: 'file',
    question: 'Allow file write?',
    toolName: 'Write',
    fileOperation: 'create',
    filePath: '/test/output.txt',
    timestamp: new Date().toISOString(),
  });
}

function executeQuestionScenario(sendEvent: MockEventSender, taskId: string): void {
  sendEvent('permission:request', {
    id: `perm_${Date.now()}`,
    taskId,
    type: 'question',
    header: 'Test Question',
    question: 'Which option do you prefer?',
    options: [
      { label: 'Option A', description: 'First option for testing' },
      { label: 'Option B', description: 'Second option for testing' },
      { label: 'Other', description: 'Enter a custom response' },
    ],
    multiSelect: false,
    timestamp: new Date().toISOString(),
  });
}
